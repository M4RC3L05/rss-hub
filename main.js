import fetch from "node-fetch";

const ac = new AbortController();

// fetch("http://127.0.0.1:4321/api/feeds/url", {
//   signal: ac.signal,
//   method: "post",
//   body: JSON.stringify({ url: "http://127.0.0.1:4322/stall" }),
//   headers: {
//     "content-type": "application/json",
//     Authorization: `Basic ${Buffer.from("foo:bar").toString("base64")}`,
//   },
// });

fetch("http://127.0.0.1:4321/api/feeds", {
  signal: ac.signal,
  headers: {
    Authorization: `Basic ${Buffer.from("foo:bar").toString("base64")}`,
  },
});

// fetch(
//   "http://127.0.0.1:4322/feeds/verify-url?url=http://127.0.0.1:4322/stall",
//   {
//     signal: ac.signal,
//     headers: {
//       Authorization: `Basic ${Buffer.from("foo:bar").toString("base64")}`,
//     },
//   },
// );

setTimeout(() => {
  ac.abort();
}, 1000);
