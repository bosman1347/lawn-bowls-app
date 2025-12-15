// Simple in-memory tournament store
let tournaments = {};

export default function handler(req, res) {
  // Allow JSON
  res.setHeader("Content-Type", "application/json");

  // GET — return all tournaments
  if (req.method === "GET") {
    res.status(200).json(tournaments);
    return;
  }

  // POST — save/update a tournament
  if (req.method === "POST") {
    const { name, data } = req.body;

    if (!name || !data) {
      res.status(400).json({ error: "Missing name or data" });
      return;
    }

    tournaments[name] = data;

    res.status(200).json({ ok: true });
    return;
  }

  // Anything else
  res.status(405).json({ error: "Method not allowed" });
}
