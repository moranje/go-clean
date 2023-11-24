import { For, Show, createSignal } from "solid-js";
import "./App.css";
import imgUrl from "./assets/283831035-46846c93-9d66-40a6-9431-7c25bd1c8dd0.png";
import searchesJson from "./searches.json";
import { Searches } from "./models/searches";

function App() {
  const [selectedString, setSelectedString] = createSignal("");
  const [copied, setCopied] = createSignal(false);

  const searchesRaw: Searches = searchesJson;
  const searches = Object.entries(searchesRaw).map(([key, value]) => ({
    league: key,
    options: Object.entries(value).map(([subKey, subValue]) => ({
      key: subKey,
      value: subValue as string,
    })),
  }));

  function onCopy() {
    navigator.clipboard.writeText(selectedString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 100);
    });
  }

  function handleSelection(value: any) {
    setSelectedString(value);
  }
  return (
    <div class="md:container md:mx-auto flex justify-center">
      <div>
        <h1>
          <span class="sr-only">GO CLEAN</span>
          <img src={imgUrl} class="object-cover max-w-xs" alt="" />
        </h1>
        <div>
          <div class="mb-4">
            <label for="select_box" class="pr-2">
              Select a league
            </label>
            <select
              class="p-2 rounded"
              onChange={(e) => handleSelection(e.target.value)}
              id="select_box"
            >
              <For each={searches}>
                {(cat) => (
                  <optgroup label={cat.league}>
                    <For each={cat.options}>
                      {(sub) => <option value={sub.value}>{sub.key}</option>}
                    </For>
                  </optgroup>
                )}
              </For>
            </select>
          </div>
          <Show when={selectedString()}>
            <div
              class="bg-white p-4 rounded transition-colors"
              classList={{ "bg-blue-300": copied() }}
            >
              <div class="flex mb-2">
                <h2 class="text-lg font-bold py-2">Search string</h2>
                <button
                  onClick={() => onCopy()}
                  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                >
                  Copy to Clipboard
                </button>
              </div>
              <pre>{selectedString().split(/,|&/g).join("\n")}</pre>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

export default App;
