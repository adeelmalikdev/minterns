import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Loader2, X, GraduationCap, User, Github, Linkedin, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Logo } from "@/components/Logo";

const DEPARTMENTS = [
  "Computer Science",
  "Electrical & Computer Engineering",
  "Information Technology",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Chemical Engineering",
  "Biomedical Engineering",
  "Aerospace Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Business Administration",
  "Other",
];

const SKILLS = [
  "React", "TypeScript", "JavaScript", "Python", "Node.js", "Java", "C++", "C#",
  "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "HTML/CSS", "Tailwind CSS",
  "Vue.js", "Angular", "Next.js", "Django", "Flask", "Spring Boot", "Express.js",
  "PostgreSQL", "MongoDB", "MySQL", "Redis", "Firebase",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
  "Git", "CI/CD", "REST APIs", "GraphQL", "WebSockets",
  "Machine Learning", "Data Analysis", "TensorFlow", "PyTorch",
  "Figma", "UI/UX Design", "Adobe Creative Suite",
  "Agile/Scrum", "Technical Writing", "Problem Solving",
];

const urlSchema = z.string().url("Please enter a valid URL").or(z.literal(""));

const formSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  university: z.string().max(100).optional().or(z.literal("")),
  registration_number: z.string().max(50).optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  semester: z.string().optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be under 500 characters").optional().or(z.literal("")),
  github_url: urlSchema.optional().or(z.literal("")),
  linkedin_url: urlSchema.optional().or(z.literal("")),
  portfolio_url: urlSchema.optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function CompleteProfile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      university: "",
      registration_number: "",
      department: "",
      semester: "",
      bio: "",
      github_url: "",
      linkedin_url: "",
      portfolio_url: "",
    },
  });

  const watchedValues = form.watch();
  const filledFields = [
    watchedValues.full_name,
    watchedValues.university,
    watchedValues.registration_number,
    watchedValues.department,
    watchedValues.semester,
    watchedValues.bio,
    selectedSkills.length > 0 ? "yes" : "",
    watchedValues.github_url,
    watchedValues.linkedin_url,
    watchedValues.portfolio_url,
    avatarUrl ? "yes" : "",
  ].filter(Boolean).length;
  const progressPercent = Math.round((filledFields / 11) * 100);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  async function onSubmit(values: FormValues) {
    if (!user?.id) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          university: values.university || null,
          registration_number: values.registration_number || null,
          department: values.department || null,
          semester: values.semester ? parseInt(values.semester) : null,
          bio: values.bio || null,
          skills: selectedSkills.length > 0 ? selectedSkills : null,
          github_url: values.github_url || null,
          linkedin_url: values.linkedin_url || null,
          portfolio_url: values.portfolio_url || null,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Profile completed!", description: "Welcome to Minterns!" });
      // Force a page reload to refresh auth state
      window.location.href = "/student/dashboard";
    } catch (error) {
      console.error("Profile update error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save profile. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Logo />
          <Badge variant="secondary" className="text-sm">
            {progressPercent}% Complete
          </Badge>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Help recruiters get to know you better. You can always update this later.
          </p>
        </div>

        <Progress value={progressPercent} className="mb-8 h-2" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <Card>
              <CardContent className="flex justify-center pt-6">
                <AvatarUpload currentUrl={avatarUrl} onUpload={setAvatarUrl} size="lg" />
              </CardContent>
            </Card>

            {/* Section 1: Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Basic details about you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input value={profile?.email || user?.email || ""} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </FormItem>

                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MIT, Stanford University" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registration_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your student ID / registration number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                              <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>Showcase your skills and online presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio / About</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself, your interests, and career goals..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground text-right">
                        {field.value?.length || 0}/500
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Skills Multi-Select */}
                <div className="space-y-2">
                  <FormLabel>Skills</FormLabel>
                  <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        {selectedSkills.length > 0
                          ? `${selectedSkills.length} skill(s) selected`
                          : "Select skills..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search skills..." />
                        <CommandList>
                          <CommandEmpty>No skill found.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-auto">
                            {SKILLS.map((skill) => (
                              <CommandItem
                                key={skill}
                                onSelect={() => toggleSkill(skill)}
                                className="cursor-pointer"
                              >
                                <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${selectedSkills.includes(skill) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                  {selectedSkills.includes(skill) && <span className="text-xs">✓</span>}
                                </div>
                                {skill}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="github_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Github className="h-4 w-4" /> GitHub
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="portfolio_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Globe className="h-4 w-4" /> Portfolio Website
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourportfolio.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Profile & Continue"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
