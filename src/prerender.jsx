import { renderToString } from "react-dom/server";
import Site from "./Site.jsx";
export function render(path) {
  return renderToString(<Site initialPath={path} />);
}
