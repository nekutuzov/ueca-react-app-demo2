// The library version this build was compiled against. Read from the package rather than written
// down, because a number written down goes stale on the next upgrade and nothing fails when it
// does — the sidebar and the home page both said 3.0 while 3.1.0 was installed. The import is a
// build-time constant: Vite inlines it, so nothing is read at runtime.
import { version } from "ueca-react/package.json";

const UECA_VERSION: string = version;

export { UECA_VERSION };
