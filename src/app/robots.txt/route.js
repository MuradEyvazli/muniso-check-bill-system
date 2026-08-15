// Bu bir personel içi POS sistemi — Google/Bing gibi arama motorlarının
// login ekranını veya başka herhangi bir sayfasını indekslemesini istemiyoruz.
export async function GET() {
  return new Response("User-agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain" },
  });
}
