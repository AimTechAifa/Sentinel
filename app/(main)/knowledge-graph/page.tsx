import { TopBar } from "@/components/layout/TopBar";
import { KnowledgeGraphView } from "@/components/knowledge-graph/KnowledgeGraphView";

export default function KnowledgeGraphPage() {
  return (
    <div>
      <TopBar
        title="Knowledge Graph"
        subtitle="Releases, services, people, tickets, and change records — connected"
        highlight
      />
      <KnowledgeGraphView />
    </div>
  );
}
