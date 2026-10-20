# VocaProna — Teacher quick start

**Live site:** https://vocaprona.vercel.app/

## 1. Create your account
1. Open the site → **Sign up**
2. Choose a **username** and password (no email required)
3. Save your **recovery code** somewhere safe

## 2. Make a game
1. **Library** → **+ New game**
2. Title, optional cover image URL, **Score tracking** (Class recommended)
3. **Save details**
4. **+ Add card** — type (Speaking works best), word, optional hint + image URL
5. **Publish game** → copy the share link

## 3. Students play alone
- Send the **/play/…** link
- No student accounts
- Chrome or Edge recommended for the microphone (or use **Type instead**)

## 4. Whole class
1. On a published game → **Start class**
2. Show the big **join code** on the board
3. Students go to **vocaprona.vercel.app/join**, enter code + name
4. Your host screen lists who joined and scores as they finish
5. **End class** when done

## 5. See scores later
- Library → **Scores** on a game

## Tips
- Use **square** images for covers and cards
- Fill **Hint for student** so the Hint button appears in play
- **Also accept** for extra answers; plurals are auto-added
- Matching is strict: missing letters (e.g. *actus* for *cactus*) will not pass

## Setup checklist (admin)
- [ ] Supabase migrations `001`–`005` applied
- [ ] Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Edge functions deployed for signup / recovery if used
- [ ] Test on a real phone in Chrome
