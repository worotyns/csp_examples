Deno.serve({port: 9000}, async (req) => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const integrity = searchParams.get("integrity");

  if (!url || !integrity || !/^sha(256|384|512)-/.test(integrity)) {
    return new Response("// Invalid request\n", { status: 400 });
  }

  try {
    const targetRes = await fetch(url);

    if (!targetRes.ok) {
      return new Response(`// Failed to fetch target (${targetRes.status})\n`, { status: 502 });
    }

    const contentBuffer = new Uint8Array(await targetRes.arrayBuffer());
    console.log(req.headers.get('host'), req.headers.get('origin'), url, integrity);

    const algo = integrity.split("-")[0].toUpperCase();
    const expectedHash = integrity.replace(/^sha(256|384|512)-/, "").replaceAll(' ', '+');

    const hashBuffer = await crypto.subtle.digest(algo.replace("SHA", "SHA-"), contentBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    if (hashBase64 === expectedHash) {
      return new Response(contentBuffer, {
        status: 200,
        headers: {
          "Content-Type": targetRes.headers.get("Content-Type") || "application/javascript",
        },
      });
    } else {
      return new Response(`// Integrity check failed\nconsole.error(\"Integrity mismatch\");\n`, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }
  } catch (e) {
    if (e instanceof Error) {
      return new Response(`// Error: ${e.message}\n`, { status: 500 });
    } else {
      console.error(e);
      return new Response(`Internal Server Error`, { status: 500 });
    }
  }
});
