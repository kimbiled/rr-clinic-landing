# Hosting on ps.kz

The plan needs Apache with `.htaccess`, PHP 7.4+ with cURL, and an SSL certificate.

1. Run `npm run build:hosting`. It produces `rr-clinic-hosting.zip` in the project root.
2. Upload the archive to the site folder (usually `public_html`) in the control panel and unpack it. Hidden files must stay: `.htaccess` is required.
3. One level above the site folder, create `lead-config.php` with the Bitrix24 incoming webhook (Bitrix24 → Developer resources → Other → Incoming webhook, with the CRM permission):

   ```php
   <?php
   return 'https://<portal>.bitrix24.kz/rest/<user id>/<secret>/';
   ```

   Keep it out of the site folder and out of git: anyone with this address can read and edit the CRM. Without it the popup shows a send error.
4. Point the `A` record of `rr-clinic.kz` and the `www` record at the hosting.
5. Turn on SSL for the domain in the control panel.

`.htaccess` sends `www` and `http` to `https://rr-clinic.kz`.
