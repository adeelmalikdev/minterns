# reCAPTCHA Setup Guide for Lovable Deployment

This guide will help you configure Google reCAPTCHA for your Lovable-hosted application.

## Domain Configuration Options

When setting up reCAPTCHA for a Lovable-hosted site, you have **two main options**:

### Option 1: Use Lovable Subdomain (Recommended for Testing)

**When to use:** During development and initial testing

**Steps:**
1. First, publish your site on Lovable:
   - Open your project in [Lovable](https://lovable.dev)
   - Click **Share → Publish**
   - You'll get a Lovable subdomain URL like: `https://your-project-name.lovable.app`

2. Use this Lovable domain when registering your reCAPTCHA site

**Pros:**
- Quick setup
- No DNS configuration needed
- Perfect for testing

**Cons:**
- Long, non-branded URL
- If you later switch to a custom domain, you'll need to update reCAPTCHA configuration

### Option 2: Use Custom Domain (Recommended for Production)

**When to use:** For production deployment with your own domain

**Steps:**
1. First, connect your custom domain to Lovable:
   - Navigate to **Project > Settings > Domains**
   - Click **Connect Domain**
   - Follow the instructions to configure your DNS records
   - See: [Lovable Custom Domain Docs](https://docs.lovable.dev/features/custom-domain#custom-domain)

2. Use your custom domain when registering your reCAPTCHA site

**Pros:**
- Professional, branded domain
- No need to reconfigure later
- Better for SEO and trust

**Cons:**
- Requires owning a domain
- Requires DNS configuration

---

## Setting Up reCAPTCHA

### Step 1: Register Your Site with Google reCAPTCHA

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)

2. Fill in the form:
   - **Label:** Give your site a name (e.g., "Minterns Login")
   - **reCAPTCHA type:** Select **"reCAPTCHA v2"**
   - **Sub-type:** Select **"Invisible reCAPTCHA badge"** (to match current implementation)
   
3. **Add domains:**
   
   For Lovable deployment, add:
   ```
   your-project-name.lovable.app
   ```
   
   For custom domain, add:
   ```
   yourdomain.com
   ```
   
   **Important:** 
   - Do NOT include `https://` or `http://`
   - Do NOT include paths (e.g., `/login`)
   - Just the domain/subdomain
   
   **For development**, also add:
   ```
   localhost
   ```

4. Accept the terms and click **Submit**

5. Copy the **Site Key** and **Secret Key**

### Step 2: Update Your Application

1. **Update the Site Key** in `/src/pages/Login.tsx` (line 24):
   ```typescript
   const RECAPTCHA_SITE_KEY = "YOUR_NEW_SITE_KEY_HERE";
   ```

2. **Verify the comment** (line 23) reflects the correct type:
   ```typescript
   // NOTE: This key must be created for "reCAPTCHA v2 Invisible" in Google reCAPTCHA admin
   ```

### Step 3: Configure Supabase Edge Function

Your backend verification function needs the **Secret Key**:

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions > Settings** or **Project Settings > Edge Functions**
3. Add/update the environment variable:
   - **Key:** `RECAPTCHA_SECRET_KEY`
   - **Value:** Your reCAPTCHA Secret Key (the second key from Google)

4. Redeploy your edge function if needed

---

## Testing Your Setup

After configuration:

1. **Clear your browser cache** (reCAPTCHA scripts can be cached)
2. Visit your login page
3. You should see a small reCAPTCHA badge in the bottom-right corner
4. Submit the login form - reCAPTCHA will verify automatically
5. Check browser console for any errors

### Common Issues

**Issue:** "Invalid key type" error
- **Cause:** Key type mismatch (using v2 Checkbox key with v2 Invisible implementation)
- **Solution:** Make sure you selected "Invisible reCAPTCHA badge" when creating the key

**Issue:** "Invalid domain for site key"
- **Cause:** Domain not registered in reCAPTCHA admin
- **Solution:** Add your Lovable domain or custom domain to the reCAPTCHA site configuration

**Issue:** reCAPTCHA not verifying
- **Cause:** Script loading issue or incorrect site key
- **Solution:** Check browser console, verify site key is correct

---

## Recommended Approach

### For Immediate Setup:

1. ✅ **Publish your site on Lovable first**
2. ✅ **Note the Lovable subdomain** (e.g., `minterns.lovable.app`)
3. ✅ **Register reCAPTCHA v2 Invisible with both:**
   - Your Lovable subdomain
   - `localhost` (for local development)
4. ✅ **Update your code** with the new keys
5. ✅ **Test on Lovable deployment**

### For Production:

1. ✅ **Set up custom domain** in Lovable settings
2. ✅ **Update reCAPTCHA domains** to include your custom domain
3. ✅ **Test thoroughly** before going live

---

## Quick Checklist

- [ ] Published site on Lovable OR configured custom domain
- [ ] Created reCAPTCHA v2 Invisible key in Google Admin
- [ ] Added correct domain(s) to reCAPTCHA configuration
- [ ] Updated `RECAPTCHA_SITE_KEY` in `Login.tsx` (or using existing key if already v2 Invisible)
- [ ] Updated `RECAPTCHA_SECRET_KEY` in Supabase Edge Function settings
- [ ] Tested login with reCAPTCHA

---

## Additional Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/invisible)
- [Lovable Custom Domain Setup](https://docs.lovable.dev/features/custom-domain#custom-domain)
- [Supabase Edge Functions Environment Variables](https://supabase.com/docs/guides/functions/secrets)

---

## Need Help?

If you continue to experience issues:
1. Check browser console for specific error messages
2. Verify all keys are copied correctly (no extra spaces)
3. Ensure domains match exactly (no `https://`, no trailing slashes)
4. Clear browser cache and try in incognito mode
5. Verify the key type in Google reCAPTCHA admin matches "Invisible reCAPTCHA badge"
