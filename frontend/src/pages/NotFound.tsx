import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { Home } from "lucide-react";
import { Page } from "../components/layout/Page";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Page title="Not found" className="grid min-h-[60vh] place-items-center text-center">
      <div className="flex flex-col items-center gap-5">
        <m.p
          initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
          animate={{ rotate: -3, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="display chunk bg-brand px-6 py-3 text-7xl text-[#17151c]"
        >
          404
        </m.p>
        <div>
          <h1 className="display-tight text-2xl">This level doesn't exist</h1>
          <p className="mt-1 text-ink-2">The page moved, or never was.</p>
        </div>
        <Button variant="primary" icon={<Home size={18} />} onClick={() => navigate("/")}>
          Back to the arcade
        </Button>
      </div>
    </Page>
  );
}
