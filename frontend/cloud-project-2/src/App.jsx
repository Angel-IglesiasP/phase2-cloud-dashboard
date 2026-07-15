import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { getDietAnalysis } from "./api";

const DIET_OPTIONS = ["all", "dash", "keto", "mediterranean", "paleo", "vegan"];
const PIE_COLORS = ["#2563eb", "#16a34a", "#9333ea", "#dc2626", "#d97706"];
const PAGE_SIZE = 6;

function ChartCard({ title, description, children }) {
  return (
    <div className="bg-white p-4 shadow-lg rounded-lg">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="w-full h-48">{children}</div>
    </div>
  );
}

function App() {
  const [diet, setDiet] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function fetchData(selectedDiet) {
    setLoading(true);
    setError(null);
    try {
      const body = await getDietAnalysis(selectedDiet);
      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(diet);
    setPage(1);
  }, [diet]);

  const macros = data?.charts?.averageMacrosByDiet ?? [];
  const recipeCounts = data?.charts?.recipeCountByDiet ?? [];
  const cuisines = data?.charts?.cuisineMacroComparison ?? [];

  const filteredCuisines = useMemo(() => {
    if (!search.trim()) return cuisines;
    return cuisines.filter((c) =>
      c.cuisineType.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [cuisines, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCuisines.length / PAGE_SIZE),
  );
  const pagedCuisines = filteredCuisines.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const maxProtein = Math.max(1, ...cuisines.map((c) => c.averageProtein));

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-blue-600 p-4 text-white">
        <h1 className="text-3xl font-semibold">Nutritional Insights</h1>
      </header>

      <main className="container mx-auto p-6">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Explore Nutritional Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ChartCard
              title="Bar Chart"
              description="Average macronutrient content by diet type."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={macros}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dietType" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="averageProtein"
                    fill="#2563eb"
                    name="Protein (g)"
                  />
                  <Bar dataKey="averageCarbs" fill="#16a34a" name="Carbs (g)" />
                  <Bar dataKey="averageFat" fill="#d97706" name="Fat (g)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Scatter Plot"
              description="Nutrient relationships (e.g., protein vs carbs)."
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="averageCarbs"
                    name="Carbs (g)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="averageProtein"
                    name="Protein (g)"
                    tick={{ fontSize: 11 }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="recipeCount"
                    range={[40, 300]}
                    name="Recipes"
                  />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={cuisines} fill="#9333ea" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Heatmap"
              description="Average protein intensity by cuisine."
            >
              <div className="w-full h-48 overflow-y-auto grid grid-cols-3 gap-1 content-start">
                {cuisines.map((c) => {
                  const intensity = c.averageProtein / maxProtein;
                  return (
                    <div
                      key={c.cuisineType}
                      title={`${c.cuisineType}: ${c.averageProtein.toFixed(1)}g protein`}
                      className="text-[10px] leading-tight text-white rounded p-1 truncate"
                      style={{
                        backgroundColor: `rgba(147, 51, 234, ${0.2 + intensity * 0.8})`,
                      }}
                    >
                      {c.cuisineType}
                    </div>
                  );
                })}
              </div>
            </ChartCard>

            <ChartCard
              title="Pie Chart"
              description="Recipe distribution by diet type."
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recipeCounts}
                    dataKey="recipeCount"
                    nameKey="dietType"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ dietType }) => dietType}
                  >
                    {recipeCounts.map((entry, index) => (
                      <Cell
                        key={entry.dietType}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Filters and Data Interaction
          </h2>
          <div className="flex flex-wrap gap-4">
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="p-2 border rounded w-full sm:w-auto"
            >
              {DIET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? "All Diet Types"
                    : option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">API Data Interaction</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => fetchData(diet)}
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? "Loading…" : "Get Nutritional Insights"}
            </button>
            <button
              onClick={() => setDiet("all")}
              className="bg-green-600 text-white py-2 px-4 rounded"
            >
              Reset Diet Filter
            </button>
          </div>
          {data?.metadata && (
            <p className="text-sm text-gray-600 mt-3">
              {data.metadata.recordCount} recipes · {data.metadata.cuisineCount}{" "}
              cuisines · fetched in {data.metadata.executionTimeMs}ms
            </p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Cuisine Comparison</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Cuisine</th>
                  <th className="p-2">Avg Protein (g)</th>
                  <th className="p-2">Avg Carbs (g)</th>
                  <th className="p-2">Recipes</th>
                </tr>
              </thead>
              <tbody>
                {pagedCuisines.map((c) => (
                  <tr key={c.cuisineType} className="border-t">
                    <td className="p-2 capitalize">{c.cuisineType}</td>
                    <td className="p-2">{c.averageProtein.toFixed(1)}</td>
                    <td className="p-2">{c.averageCarbs.toFixed(1)}</td>
                    <td className="p-2">{c.recipeCount}</td>
                  </tr>
                ))}
                {pagedCuisines.length === 0 && (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={4}>
                      No cuisines match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded ${p === page ? "bg-blue-600 text-white" : "bg-gray-300 hover:bg-gray-400"}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-blue-600 p-4 text-white text-center mt-10">
        <p>&copy; 2026 Nutritional Insights. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default App;
