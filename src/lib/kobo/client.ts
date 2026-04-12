const KOBO_BASE = "https://kf.kobotoolbox.org";

export async function koboFetch(path: string): Promise<Response> {
  const token = process.env.KOBO_TOKEN;
  if (!token) throw new Error("KOBO_TOKEN is not set");

  const url = `${KOBO_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  return res;
}
