import DietDashboard from "./dashboard-client";
import { getDietAnalysis } from "./lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getDietAnalysis("all");

  return <DietDashboard initialData={initialData} />;
}
