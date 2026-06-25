import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  process.stdout.write(
    `VitalTrack backend API listening on port ${env.port} (api ${env.apiVersion})\n`,
  );
});
