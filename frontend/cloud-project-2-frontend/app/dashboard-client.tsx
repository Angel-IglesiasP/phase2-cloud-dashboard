"use client";

import { useState } from "react";
import { DietAnalysisResponse, getDietAnalysis } from "./lib/api";

const DIET_OPTIONS = ["all", "dash", "keto", "mediterranean", "paleo", "vegan"];

export default function DietDashboard({
  initialData,
}: {
  initialData: DietAnalysisResponse;
}) {
  const [diet, setDiet] = useState("all");
  const [data, setData] = useState<DietAnalysisResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData(selectedDiet: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await getDietAnalysis(selectedDiet);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleDietChange(nextDiet: string) {
    setDiet(nextDiet);
    loadData(nextDiet);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gray-100">
      <header className="bg-blue-600 p-4 text-slate-900">
        <h1 className="text-3xl font-semibold">Diet Dashboard</h1>
      </header>

      <main className="container mx-auto flex-1 p-6">
        {error && (
          <div className="mb-8 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            Explore Nutritional Insights
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Records" value={data.metadata.recordCount} />
            <StatCard label="Diet types" value={data.metadata.dietTypeCount} />
            <StatCard label="Cuisines" value={data.metadata.cuisineCount} />
            <StatCard
              label="Query time"
              value={`${data.metadata.executionTimeMs} ms`}
            />
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="Average macros by diet (g)">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-900">
                  <th className="py-2 pr-4">Diet</th>
                  <th className="py-2 pr-4">Protein</th>
                  <th className="py-2 pr-4">Carbs</th>
                  <th className="py-2 pr-4">Fat</th>
                </tr>
              </thead>
              <tbody>
                {data.charts.averageMacrosByDiet.map((row) => (
                  <tr key={row.dietType} className="border-b border-gray-100">
                    <td className="py-2 pr-4 capitalize">{row.dietType}</td>
                    <td className="py-2 pr-4">{row.averageProtein}</td>
                    <td className="py-2 pr-4">{row.averageCarbs}</td>
                    <td className="py-2 pr-4">{row.averageFat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Recipe count by diet">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-900">
                  <th className="py-2 pr-4">Diet</th>
                  <th className="py-2 pr-4">Recipes</th>
                </tr>
              </thead>
              <tbody>
                {data.charts.recipeCountByDiet.map((row) => (
                  <tr key={row.dietType} className="border-b border-gray-100">
                    <td className="py-2 pr-4 capitalize">{row.dietType}</td>
                    <td className="py-2 pr-4">{row.recipeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Cuisine macro comparison">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-900">
                  <th className="py-2 pr-4">Cuisine</th>
                  <th className="py-2 pr-4">Protein</th>
                  <th className="py-2 pr-4">Carbs</th>
                  <th className="py-2 pr-4">Recipes</th>
                </tr>
              </thead>
              <tbody>
                {data.charts.cuisineMacroComparison.map((row) => (
                  <tr
                    key={row.cuisineType}
                    className="border-b border-gray-100"
                  >
                    <td className="py-2 pr-4 capitalize">{row.cuisineType}</td>
                    <td className="py-2 pr-4">{row.averageProtein}</td>
                    <td className="py-2 pr-4">{row.averageCarbs}</td>
                    <td className="py-2 pr-4">{row.recipeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            Filters and Data Interaction
          </h2>
          <div className="flex flex-wrap gap-4">
            <select
              value={diet}
              onChange={(e) => handleDietChange(e.target.value)}
              className="w-full rounded border p-2 sm:w-auto"
            >
              {DIET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All Diet Types" : option}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">API Data Interaction</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => loadData(diet)}
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-slate-900 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Get Nutritional Insights"}
            </button>
          </div>
        </section>

        <p className="mt-8 text-xs text-slate-900">
          Generated at {data.metadata.generatedAt} &middot; source:{" "}
          {data.metadata.source}
        </p>
      </main>

      <footer className="mt-10 bg-blue-600 p-4 text-center text-slate-900">
        <p>&copy; 2026 Diet Dashboard. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-lg">
      <p className="text-xs uppercase tracking-wide text-slate-900">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white p-4 shadow-lg">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
