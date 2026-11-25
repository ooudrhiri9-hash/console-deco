# WhatsApp order confirmation

When a customer places an order, the API sends them a WhatsApp message with two buttons:

> Bonjour Sara, merci pour votre commande **CMD-8F3K2Q** chez Maison Déco.
> Montant : **1 250 DH**, payable à la livraison.
> Merci de confirmer votre commande.
> **[ Confirmer ]  [ Annuler ]**

- **Confirmer**: the order moves to **Confirmée** and the customer gets a thank-you message.
- **Annuler**: the order moves to **Annulée** and the customer gets an acknowledgement.
- **No answer after 3 h, send failed, or quote order**: the admin shows **"À rappeler"**. Filter *Commandes → Statut → À rappeler* to get the call list.
- A second tap on an order that is already confirmed or cancelled changes nothing. The customer is told the current status.
- **Quote orders** (price on request / custom size) are **not** sent automatically: there is no price to confirm yet. After calling, use **"Envoyer la confirmation WhatsApp"** in the order detail.
- With the WhatsApp variables empty, everything works exactly as before.

## Files

| File | Role |
|---|---|
| `backend/src/lib/whatsapp.js` | Cloud API client, phone normalisation (06… → 2126…), signature check, reply texts |
| `backend/src/routes/whatsapp.js` | Webhook: Meta verification (GET), button taps + delivery statuses (POST) |
| `backend/src/routes/orders.js` | Sends the template after each new order; `POST /api/admin/orders/:ref/whatsapp` to resend |
| `frontend/src/app/(admin)/admin/commandes/page.tsx` | WhatsApp status per order, "À rappeler" badge + filter, resend button |

## One-time setup in Meta (about 1 hour, plus business verification)

1. **Meta Business account**: business.facebook.com, preferably verified (needed to go beyond 250 conversations/day and to show the business name).
2. **Developer app**: developers.facebook.com → *Create app* → type *Business* → add the **WhatsApp** product.
3. **Phone number**: *WhatsApp → API Setup → Add phone number*.
   ⚠ This number can no longer be used in the regular WhatsApp app on a phone. Use a new SIM, or move the current number knowing the client will then reply from WhatsApp Business Manager / a third-party inbox.
   Copy the **Phone number ID**, which goes in `WHATSAPP_PHONE_NUMBER_ID`.
4. **Permanent token**: *Business settings → System users → Add* (Admin) → *Generate token* for the app, permissions `whatsapp_business_messaging` + `whatsapp_business_management`, expiry **never**. This goes in `WHATSAPP_TOKEN`.
   (The temporary token shown on API Setup expires after 24 h. Use it for testing only.)
5. **App secret**: *App settings → Basic → App secret*, which goes in `WHATSAPP_APP_SECRET`.
6. **Message template**: *WhatsApp Manager → Message templates → Create*
   - Category: **Utility**
   - Name: `confirmation_commande`
   - Language: **French**
   - Body:
     ```
     Bonjour {{1}}, merci pour votre commande {{2}} chez Maison Déco.
     Montant : {{3}} DH, payable à la livraison.
     Merci de confirmer votre commande.
     ```
     Sample values: `Sara`, `CMD-8F3K2Q`, `1 250`
   - Buttons: **Quick reply** → `Confirmer`, then **Quick reply** → `Annuler` (in that order: button 0 = confirm, 1 = cancel).
   - Optional: add an **English** translation of the same template, then set `WHATSAPP_TEMPLATE_LANGS=fr,en` so /en customers receive it in English.
7. **Webhook**: *WhatsApp → Configuration → Webhook*
   - Callback URL: `https://maisondeco.ma/api/webhooks/whatsapp`
   - Verify token: any random string, which also goes in `WHATSAPP_VERIFY_TOKEN`
   - Click **Verify and save** (the API must already be running with that variable), then subscribe to the **messages** field.

## Server variables (`/srv/maisondeco/backend/.env`)

```
WHATSAPP_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_APP_SECRET=abcdef...
WHATSAPP_VERIFY_TOKEN=some-long-random-string
WHATSAPP_TEMPLATE_CONFIRM=confirmation_commande
WHATSAPP_TEMPLATE_LANGS=fr
```

Restart the API (`pm2 restart` / `deploy.sh`). The boot log prints `WhatsApp : confirmation des commandes activée.`

## Test

Place a real order on the site with your own phone number. You should receive the message within seconds. Tap **Confirmer**, and the admin shows the order as *Confirmée — par le client (WhatsApp)*.

## Cost

Meta bills each **utility template** sent (the confirmation). The thank-you reply after a tap is free (it's inside the 24 h window the customer opened). Check the current Morocco rate on Meta's WhatsApp pricing page; for a few hundred orders a month it's a small monthly amount.

## Troubleshooting

| Symptom in the admin | Cause |
|---|---|
| "WhatsApp non configuré" | `WHATSAPP_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` empty on the server |
| "WhatsApp en échec", error `132001` | Template name or language doesn't match an **approved** template |
| Error `190` | Token expired (temporary token used) |
| Error `131026` | Number not on WhatsApp, or the customer can't receive messages |
| Message received but the tap does nothing | Webhook not subscribed to `messages`, or `WHATSAPP_APP_SECRET` wrong (the API answers 401) |
| Number "non valide pour WhatsApp" | The phone typed at checkout isn't a mobile; fix it by phone, then resend |
