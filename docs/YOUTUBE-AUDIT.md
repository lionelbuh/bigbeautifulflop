# YouTube API audit: answers for the form

Form: “YouTube API Services – Audit and Quota Extension Form”
(https://support.google.com/youtube/contact/yt_api_form). Fill it in English, signed in with the Google
account that owns the Big Beautiful Flop channel and the Google Cloud project.

Why: videos uploaded through an API project that has not passed the audit stay private (locked).
After approval, uploads can be public.

## Contact and organisation

- **Name / email:** your own (the channel owner).
- **Organisation:** Big Beautiful Flop (independent publication, individual owner). Website:
  https://bigbeautifulflop.com
- **Country:** United States (California).

## API client

- **Google Cloud project number and ID:** Google Cloud console → project “Big Beautiful Flop” →
  Dashboard (“Project number”, “Project ID”).
- **OAuth client ID:** Google Cloud → Clients → BBF Publisher (the ID ending in
  `.apps.googleusercontent.com`; never the secret).
- **API used:** YouTube Data API v3.
- **Methods used:** `videos.insert` (upload), `channels.list` with `mine=true` (to check which channel
  the key reaches).
- **Scopes:** `youtube.upload`, `youtube.readonly`.

## Use case (paste as is)

> Big Beautiful Flop (https://bigbeautifulflop.com) is an independent satirical publication. It quotes
> public posts by Donald Trump verbatim, with date and source, and shows them rewritten as a
> statesmanlike president would say them and as people from different regions (Switzerland, France,
> the United States, the United Kingdom) would say them. Every rewrite is clearly labelled satire.
>
> We use the YouTube Data API only to publish our own short vertical videos (30 to 35 seconds, our
> own text, our own synthesized music, no third-party footage, no voice) to our own channel, “Big
> Beautiful Flop”. A small internal tool (“BBF Publisher”, a Node.js script run by GitHub Actions)
> uploads two videos per new statement and one summary video every Sunday: about two to ten uploads
> a week.
>
> The tool is used only by the channel owner. It has no users, no user interface, and no access to
> any other YouTube account. It does not read, store or display any YouTube data beyond our own
> channel’s name and the IDs of the videos it uploaded (kept in a log file to avoid posting twice).
> It does not access viewers’ data, comments, analytics or any other channel.

## Data handling

- **Which YouTube data is stored, and for how long:** only the IDs of our own uploaded videos and the
  upload time, in a log file in our private code repository, kept to avoid duplicate uploads.
- **Is YouTube data shared with third parties:** no.
- **Is YouTube data combined with other data:** no.
- **Privacy policy:** https://bigbeautifulflop.com/privacy/ (section “Our publishing tool and
  YouTube”, with links to the YouTube Terms of Service and the Google Privacy Policy, and to Google’s
  permission page to revoke access).
- **Terms of service:** not applicable (no users); if a link is required:
  https://bigbeautifulflop.com/about/

## Quota

- **Default quota (10,000 units a day) is enough:** an upload costs 1,600 units; we upload at most
  about six videos a day. No quota increase needed.

## Documentation / screenshots they may ask for

- A short screen recording (1–2 minutes) is the easiest proof: show the website, a video on the
  channel, and the GitHub Actions run “Social networks” uploading it (the log line
  “youtube: posted”). No code or keys on screen.
- Or screenshots: the site, the privacy page, the channel, the Actions log.

## After approval

Nothing to change in the code: new uploads become public. Videos uploaded before approval stay
private: you can make them public by hand in YouTube Studio, or leave them.
