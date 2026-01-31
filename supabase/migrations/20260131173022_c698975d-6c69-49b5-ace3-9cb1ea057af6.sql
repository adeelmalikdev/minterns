-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  recruiter_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_conversations_student ON public.conversations(student_id);
CREATE INDEX idx_conversations_recruiter ON public.conversations(recruiter_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Students can view their conversations"
ON public.conversations FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Recruiters can view their conversations"
ON public.conversations FOR SELECT
USING (recruiter_id = auth.uid());

CREATE POLICY "Participants can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role))
  OR (recruiter_id = auth.uid() AND has_role(auth.uid(), 'recruiter'::app_role))
);

-- RLS Policies for messages
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.student_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.student_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);

CREATE POLICY "Recipients can mark messages read"
ON public.messages FOR UPDATE
USING (
  sender_id != auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.student_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
)
WITH CHECK (
  sender_id != auth.uid()
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Trigger to auto-create conversation on application acceptance
CREATE OR REPLACE FUNCTION public.create_conversation_on_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IN ('accepted', 'in_progress') AND OLD.status = 'pending') THEN
    INSERT INTO public.conversations (application_id, student_id, recruiter_id)
    SELECT 
      NEW.id,
      NEW.student_id,
      o.recruiter_id
    FROM public.opportunities o
    WHERE o.id = NEW.opportunity_id
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_accepted
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.create_conversation_on_accept();

-- Trigger to update conversation updated_at when new message arrives
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();