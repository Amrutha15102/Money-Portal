const loadButton = document.querySelector("#load-rate");
const result = document.querySelector("#result");

async function loadRate() {
  loadButton.disabled = true;
  result.textContent = "Loading exchange rate…";

  try {
    const response = await fetch(
      "https://api.frankfurter.dev/v2/rate/eur/usd"
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Number.isFinite(data.rate)) {
      throw new Error("The API returned an invalid rate.");
    }

    result.textContent =
      `1 EUR = ${data.rate.toFixed(4)} USD. Rate date: ${data.date}`;
  } catch (error) {
    result.textContent =
      "Could not load the exchange rate. Please try again.";
    console.error(error);
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadRate);
const historyButton = document.querySelector("#load-history");
const historyStatus = document.querySelector("#history-status");

async function loadHistory() {
const startInput = document.querySelector("#start-date");
const endInput = document.querySelector("#end-date");

if (!startInput.reportValidity() || !endInput.reportValidity()) {
  return;
}

const startDate = startInput.value;
const endDate = endInput.value;

if (startDate > endDate) {
  historyStatus.textContent =
    "Start date must be before or equal to end date.";
  return;
}

const now = new Date();
const today =
  `${now.getFullYear()}-` +
  `${String(now.getMonth() + 1).padStart(2, "0")}-` +
  `${String(now.getDate()).padStart(2, "0")}`;

if (endDate > today) {
  historyStatus.textContent = "Choose an end date that is not in the future.";
  return;
}
  historyButton.disabled = true;
  historyStatus.textContent = "Loading historical rates…";
  document.querySelector("#rate-summary").hidden = true;
document.querySelector("#rate-summary-note").hidden = true;

  try {
     const url =
  "https://api.frankfurter.dev/v2/rates" +
  "?base=EUR&quotes=USD" +
  `&from=${startDate}&to=${endDate}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No historical rates returned.");
    }

    const sortedData = [...data].sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    const dates = sortedData.map(item => item.date);
    const rates = sortedData.map(item => item.rate);
    // Summarise the selected historical observations.
if (rates.some(rate =>
  !Number.isFinite(rate) || rate <= 0
)) {
  throw new Error("Invalid historical rate data.");
}

let lowestIndex = 0;
let highestIndex = 0;

rates.forEach((rate, index) => {
  if (rate < rates[lowestIndex]) lowestIndex = index;
  if (rate > rates[highestIndex]) highestIndex = index;
});

const firstRate = rates[0];
const lastRate = rates[rates.length - 1];
const periodChange = ((lastRate / firstRate) - 1) * 100;

document.querySelector("#rate-low").textContent =
  `${rates[lowestIndex].toFixed(4)} USD per EUR · ` +
  dates[lowestIndex];

document.querySelector("#rate-high").textContent =
  `${rates[highestIndex].toFixed(4)} USD per EUR · ` +
  dates[highestIndex];

const changeOutput = document.querySelector("#rate-change");

changeOutput.textContent = rates.length > 1
  ? `${periodChange > 0 ? "+" : ""}${periodChange.toFixed(2)}%`
  : "Not enough observations";

document.querySelector("#rate-summary").hidden = false;
document.querySelector("#rate-summary-note").hidden = false;
    const chartContainer = document.querySelector("#history-chart");
const pointDetails = document.querySelector("#point-details");

pointDetails.textContent =
  "Click a chart point to see its date and exchange rate.";

chartContainer.onclick = function (event) {
  const dot = event.target.closest("circle");

  if (!dot || !chartContainer.contains(dot)) {
    return;
  }

  const pointIndex = dot.getAttribute("data-point-index");

  const index = pointIndex !== null
    ? Number(pointIndex)
    : Array.from(
        chartContainer.querySelectorAll("svg circle")
      ).indexOf(dot);

  if (!Number.isInteger(index) || index < 0 || index >= rates.length) {
    return;
  }

  pointDetails.textContent =
    `Date: ${dates[index]} | ` +
    `1 EUR = ${rates[index].toFixed(4)} USD | ` +
    "Source: Frankfurter";
};


chartContainer.pointHandler = function (event) {
  const index = event.index;

  if (!Number.isInteger(index) || index < 0 || index >= rates.length) {
    return;
  }

  pointDetails.textContent =
    `Date: ${dates[index]} | ` +
    `1 EUR = ${rates[index].toFixed(4)} USD | ` +
    "Source: Frankfurter";
};

chartContainer.addEventListener(
  "data-select",
  chartContainer.pointHandler
);
pointDetails.textContent =
  "Click a chart point to see its date and exchange rate.";

chartContainer.onselectstart = null;

chartContainer.onDataSelect = null;
    if (!window.frappe) {
  throw new Error("The chart library could not load.");
}


document.querySelector("#history-chart").replaceChildren();

new frappe.Chart("#history-chart", {
  title: `EUR to USD: ${startDate} to ${endDate}`,
  data: {
    labels: dates,
    datasets: [
      {
        name: "USD per EUR",
        values: rates
      }
    ]
  },
  type: "line",
  isNavigable: true,
  height: 300,
  colors: [document.querySelector("#line-color").value]
});

    console.table(sortedData);
    console.log("Chart dates:", dates);
    console.log("Chart rates:", rates);

    historyStatus.textContent =
      `Loaded ${rates.length} exchange-rate observations.`;
  } catch (error) {
    historyStatus.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    historyButton.disabled = false;
  }
}

historyButton.addEventListener("click", loadHistory);
const downloadButton = document.querySelector("#download-chart");
const downloadStatus = document.querySelector("#download-status");

downloadButton.addEventListener("click", () => {
  const svg = document.querySelector("#history-chart svg");

  if (!svg) {
    downloadStatus.textContent = "Load a chart before downloading.";
    return;
  }

  const copy = svg.cloneNode(true);
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Preserve the chart's appearance in the downloaded file.
  const originals = [svg, ...svg.querySelectorAll("*")];
  const copies = [copy, ...copy.querySelectorAll("*")];

  const properties = [
    "fill", "stroke", "stroke-width", "stroke-dasharray",
    "opacity", "font-family", "font-size", "font-weight"
  ];

  originals.forEach((element, index) => {
    const styles = getComputedStyle(element);

    properties.forEach(property => {
      copies[index].style.setProperty(
        property,
        styles.getPropertyValue(property)
      );
    });
  });

  copy.style.backgroundColor = "white";

  const content = new XMLSerializer().serializeToString(copy);
  const file = new Blob([content], {
    type: "image/svg+xml;charset=utf-8"
  });

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "currency-chart.svg";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 10000);

  downloadStatus.textContent = "Chart download requested.";
});
const cryptoSelect = document.querySelector("#crypto-select");
const cryptoButton = document.querySelector("#load-crypto");
const cryptoResult = document.querySelector("#crypto-result");

async function loadCryptoPrice() {
  const symbol = cryptoSelect.value;

  cryptoButton.disabled = true;
  cryptoResult.textContent = "Loading crypto price…";

  try {
    const response = await fetch(
      `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const json = await response.json();
    const amount = Number(json.data?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("No valid price returned.");
    }

    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);

    cryptoResult.textContent =
      `1 ${symbol} = ${formattedPrice}. ` +
      `Retrieved at ${new Date().toLocaleTimeString()}.`;
  } catch (error) {
    cryptoResult.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    cryptoButton.disabled = false;
  }
}

cryptoButton.addEventListener("click", loadCryptoPrice);
const compareEurButton = document.querySelector("#compare-eur");
const eurStatus = document.querySelector("#eur-status");

async function fetchComparisonData(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function compareInEuros() {
  compareEurButton.disabled = true;
  eurStatus.textContent = "Loading prices and exchange rate…";

  try {
    if (!window.frappe) {
      throw new Error("Chart library is unavailable.");
    }

    const symbols = ["BTC", "ETH", "DOGE"];

    const [exchange, ...prices] = await Promise.all([
      fetchComparisonData(
        "https://api.frankfurter.dev/v2/rate/eur/usd"
      ),
      ...symbols.map(symbol =>
        fetchComparisonData(
          `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
        )
      )
    ]);

    const usdPerEuro = Number(exchange.rate);

    if (!Number.isFinite(usdPerEuro) || usdPerEuro <= 0) {
      throw new Error("Invalid exchange rate.");
    }

    const euroPrices = prices.map(price => {
      const dollars = Number(price.data?.amount);

      if (!Number.isFinite(dollars) || dollars <= 0) {
        throw new Error("Invalid crypto price.");
      }

      return dollars / usdPerEuro;
    });

    document.querySelector("#eur-chart").replaceChildren();

    new frappe.Chart("#eur-chart", {
      title: "Value of one coin in EUR",
      data: {
        labels: symbols,
        datasets: [
          {
            name: "EUR per coin",
            values: euroPrices
          }
        ]
      },
      type: "bar",
      height: 300,
      colors: ["#334FCC"]
    });

    const amounts = euroPrices.map((price, index) =>
      `${symbols[index]}: ${price.toLocaleString("en-FI", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 4
      })}`
    );

    eurStatus.textContent =
      amounts.join(" | ") +
      `. Exchange-rate date: ${exchange.date}. ` +
      `Prices retrieved at ${new Date().toLocaleTimeString()}.`;
  } catch (error) {
    eurStatus.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    compareEurButton.disabled = false;
  }
}

compareEurButton.addEventListener("click", compareInEuros);
const sentimentButton = document.querySelector("#load-sentiment");
const sentimentResult = document.querySelector("#sentiment-result");
const sentimentMeter = document.querySelector("#sentiment-meter");

async function loadSentiment() {
  sentimentButton.disabled = true;
  sentimentResult.textContent = "Loading market sentiment…";
  sentimentMeter.hidden = true;

  try {
    const response = await fetch(
      "https://api.alternative.me/fng/?limit=1"
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const json = await response.json();

    if (json.metadata?.error) {
      throw new Error(String(json.metadata.error));
    }

    const latest = json.data?.[0];

    if (!latest) {
      throw new Error("No sentiment data returned.");
    }

    const score = Number(latest.value);
    const timestamp = Number(latest.timestamp);

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100 ||
      !Number.isFinite(timestamp)
    ) {
      throw new Error("Invalid sentiment data.");
    }

    const date = new Date(timestamp * 1000)
      .toISOString()
      .slice(0, 10);

    sentimentResult.textContent =
      `${score}/100 — ${latest.value_classification}. ` +
      `Index date: ${date} (UTC).`;

    sentimentMeter.value = score;
    sentimentMeter.setAttribute(
      "aria-label",
      `Bitcoin sentiment: ${score} out of 100`
    );
    sentimentMeter.hidden = false;
  } catch (error) {
    sentimentResult.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    sentimentButton.disabled = false;
  }
}

sentimentButton.addEventListener("click", loadSentiment);
const purchaseButton = document.querySelector("#calculate-purchase");
const purchaseResult = document.querySelector("#purchase-result");
const purchaseSuggestion = document.querySelector("#purchase-suggestion");

async function calculatePurchase() {
  const dateInput = document.querySelector("#purchase-date");
  const quantityInput = document.querySelector("#purchase-quantity");
  const costInput = document.querySelector("#purchase-cost");
  const symbol = document.querySelector("#purchase-coin").value;

  purchaseSuggestion.textContent = "";

  for (const input of [dateInput, quantityInput, costInput]) {
    if (!input.reportValidity()) {
      return;
    }
  }

  const purchaseDate = dateInput.value;
  const quantity = Number(quantityInput.value);
  const cost = Number(costInput.value);

  const now = new Date();
  const today =
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`;

  if (purchaseDate > today) {
    purchaseResult.textContent = "Purchase date cannot be in the future.";
    return;
  }

  if (
    !Number.isFinite(quantity) || quantity <= 0 ||
    !Number.isFinite(cost) || cost <= 0
  ) {
    purchaseResult.textContent = "Enter positive, valid purchase amounts.";
    return;
  }

  purchaseButton.disabled = true;
  purchaseResult.textContent = "Loading current price…";

  try {
    const response = await fetch(
      `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const json = await response.json();
    const price = Number(json.data?.amount);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Invalid current price.");
    }

    const currentValue = quantity * price;
    const profit = currentValue - cost;
    const percentage = (profit / cost) * 100;

    if (!Number.isFinite(currentValue) || !Number.isFinite(percentage)) {
      throw new Error("Purchase amounts are too large.");
    }

    const money = value => value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });

    purchaseResult.textContent =
      `${quantity} ${symbol} bought on ${purchaseDate}. ` +
      `Paid: ${money(cost)}. ` +
      `Current value: ${money(currentValue)}. ` +
      `Gain/loss: ${money(profit)} (${percentage.toFixed(2)}%). ` +
      `Price retrieved at ${new Date().toLocaleTimeString()}.`;

    let suggestion = "Hold";
    let reason = "The return is between −10% and +10%.";

    if (percentage >= 10) {
      suggestion = "Sell";
      reason = "The gain has reached the simulation’s 10% threshold.";
    } else if (percentage <= -10) {
      suggestion = "Buy more";
      reason = "The loss has reached the simulation’s −10% threshold.";
    }

    purchaseSuggestion.textContent =
      `Simulation result: ${suggestion}. ${reason}`;
  } catch (error) {
    purchaseResult.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    purchaseButton.disabled = false;
  }
}

purchaseButton.addEventListener("click", calculatePurchase);
let comparisonChartCount = 0;

const addChartButton = document.querySelector("#add-chart");
const chartBoard = document.querySelector("#chart-board");

function addComparisonChart() {
  comparisonChartCount += 1;

  const card = document.createElement("article");
  card.className = "comparison-card";

  card.innerHTML = `
    <h3>Chart ${comparisonChartCount}</h3>

    <div class="comparison-controls">
      <label>
        Compare EUR against
        <select class="comparison-currency">
          <option value="USD">US dollar</option>
          <option value="GBP">British pound</option>
          <option value="JPY">Japanese yen</option>
        </select>
      </label>

      <label>
        Start date
        <input class="comparison-start" type="date" required>
      </label>

      <label>
        End date
        <input class="comparison-end" type="date" required>
      </label>

      <label>
        Line colour
        <input class="comparison-colour"
               type="color" value="#334fcc">
      </label>
    </div>

    <button class="comparison-load" type="button">
      Load this chart
    </button>

    <button class="comparison-remove" type="button">
      Remove chart
    </button>
    <button class="comparison-add" type="button">
    Add selected currency / update colours
    </button>

<p>
  Choose a currency above, then tap Add selected currency.
  Use Load this chart to return to a single currency.
</p>
    <p class="comparison-status" role="status"></p>
    <div class="comparison-plot"></div>
    <p>Source: Frankfurter. Quote-currency units per EUR.</p>
  `;

  chartBoard.appendChild(card);

  const start = card.querySelector(".comparison-start");
  const end = card.querySelector(".comparison-end");
  const currency = card.querySelector(".comparison-currency");
  const colour = card.querySelector(".comparison-colour");
  const load = card.querySelector(".comparison-load");
  const status = card.querySelector(".comparison-status");
  const plot = card.querySelector(".comparison-plot");

  start.value = document.querySelector("#start-date").value;
  end.value = document.querySelector("#end-date").value;

  card.querySelector(".comparison-remove").addEventListener(
    "click",
    () => card.remove()
  );

  load.addEventListener("click", async () => {
    if (!start.reportValidity() || !end.reportValidity()) {
      return;
    }

    if (start.value > end.value) {
      status.textContent = "Start date must not follow end date.";
      return;
    }

    const selectedCurrency = currency.value;
    const selectedStart = start.value;
    const selectedEnd = end.value;
    const selectedColour = colour.value;

    load.disabled = true;
    status.textContent = "Loading…";

    try {
      if (!window.frappe) {
        throw new Error("Chart library is unavailable.");
      }

      const url =
        "https://api.frankfurter.dev/v2/rates" +
        `?base=EUR&quotes=${selectedCurrency}` +
        `&from=${selectedStart}&to=${selectedEnd}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No data available for this period.");
      }

      const rows = [...data].sort(
        (a, b) => a.date.localeCompare(b.date)
      );

      if (rows.some(row => !Number.isFinite(row.rate))) {
        throw new Error("Invalid exchange-rate data.");
      }

      // The user might have removed this card while it loaded.
      if (!card.isConnected) {
        return;
      }

      plot.replaceChildren();

      new frappe.Chart(plot, {
        title: `EUR to ${selectedCurrency}`,
        data: {
          labels: rows.map(row => row.date),
          datasets: [{
            name: `${selectedCurrency} per EUR`,
            values: rows.map(row => row.rate)
          }]
        },
        type: "line",
        height: 250,
        colors: [selectedColour]
      });

      status.textContent =
        `${selectedStart} to ${selectedEnd}: ` +
        `${rows.length} observations.`;

      card.querySelector(".comparison-plot + p").textContent =
        "Source: Frankfurter. Quote-currency units per EUR.";

    } catch (error) {
      status.textContent = `Error: ${error.message}`;
      console.error(error);
    } finally {
      load.disabled = false;
    }
  });
}

addChartButton.addEventListener("click", addComparisonChart);
const currencyTray = document.querySelector("#currency-tray");
const allowedCurrencies = ["USD", "GBP", "JPY"];

currencyTray.addEventListener("dragstart", event => {
  const item = event.target.closest("[data-currency]");

  if (!item) return;

  event.dataTransfer.setData("text/plain", item.dataset.currency);
  event.dataTransfer.effectAllowed = "copy";
});

chartBoard.addEventListener("dragover", event => {
  const card = event.target.closest(".comparison-card");

  if (!card) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  card.classList.add("drop-ready");
});

chartBoard.addEventListener("dragleave", event => {
  const card = event.target.closest(".comparison-card");

  if (card && !card.contains(event.relatedTarget)) {
    card.classList.remove("drop-ready");
  }
});

// Loading the original chart starts a new comparison.
chartBoard.addEventListener("click", event => {
  if (event.target.closest(".comparison-load")) {
    const card = event.target.closest(".comparison-card");
    delete card.dataset.comparisonCurrencies;
  }
}, true);

// Both desktop dropping and mobile buttons use this function.
async function addCurrencyToChart(card, addedCurrency) {
  if (!allowedCurrencies.includes(addedCurrency)) return;

  const status = card.querySelector(".comparison-status");
  const load = card.querySelector(".comparison-load");
  const add = card.querySelector(".comparison-add");

  if (load.disabled) {
    status.textContent = "Wait for this chart to finish loading.";
    return;
  }

  const start = card.querySelector(".comparison-start");
  const end = card.querySelector(".comparison-end");

  if (!start.reportValidity() || !end.reportValidity()) return;

  if (start.value > end.value) {
    status.textContent = "Start date must not follow end date.";
    return;
  }

  const now = new Date();
  const today =
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`;

  if (end.value > today) {
    status.textContent = "End date cannot be in the future.";
    return;
  }

  const original =
    card.querySelector(".comparison-currency").value;

  const previous = card.dataset.comparisonCurrencies;

  const currencies = [...new Set([
    ...(previous ? previous.split(",") : [original]),
    addedCurrency
  ])];

  const startDate = start.value;
  const endDate = end.value;

  load.disabled = true;
  if (add) add.disabled = true;
  status.textContent = "Loading currency comparison…";

  try {
    if (!window.frappe) {
      throw new Error("Chart library is unavailable.");
    }

    const url =
      "https://api.frankfurter.dev/v2/rates" +
      `?base=EUR&quotes=${currencies.join(",")}` +
      `&from=${startDate}&to=${endDate}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid comparison data.");
    }

    const byDate = new Map();

    data.forEach(row => {
      if (!Number.isFinite(row.rate) || row.rate <= 0) return;

      if (!byDate.has(row.date)) {
        byDate.set(row.date, {});
      }

      byDate.get(row.date)[row.quote] = row.rate;
    });

    const dates = [...byDate.keys()]
      .sort()
      .filter(date =>
        currencies.every(code =>
          byDate.get(date)[code] !== undefined
        )
      );

    if (dates.length === 0) {
      throw new Error("No shared dates available.");
    }

    if (!card.isConnected) return;

    const plot = card.querySelector(".comparison-plot");
    plot.replaceChildren();

    new frappe.Chart(plot, {
      title: "Currency comparison: first shared date = 100",
      data: {
        labels: dates,
        datasets: currencies.map(code => {
          const firstRate = byDate.get(dates[0])[code];

          return {
            name: `${code} per EUR (index)`,
            values: dates.map(date =>
              100 * byDate.get(date)[code] / firstRate
            )
          };
        })
      },
      type: "line",
      height: 280,
      colors: currencies.map(code =>
        document.querySelector(`#${code}-colour`).value
      )
    });

    card.dataset.comparisonCurrencies = currencies.join(",");

    status.textContent =
      `${currencies.join(" + ")} | ` +
      `${dates[0]} to ${dates[dates.length - 1]} | ` +
      "First shared date = 100.";

    card.querySelector(".comparison-plot + p").textContent =
      "Source: Frankfurter. Indexed quote-currency units per EUR; " +
      "these show relative changes, not raw exchange rates.";
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    load.disabled = false;
    if (add) add.disabled = false;
  }
}

// Desktop: drag a currency onto a chart.
chartBoard.addEventListener("drop", event => {
  const card = event.target.closest(".comparison-card");

  if (!card) return;

  event.preventDefault();
  card.classList.remove("drop-ready");

  const code = event.dataTransfer.getData("text/plain");
  addCurrencyToChart(card, code);
});

// Phone or desktop: choose a currency and press Add.
chartBoard.addEventListener("click", event => {
  const button = event.target.closest(".comparison-add");

  if (!button) return;

  const card = button.closest(".comparison-card");
  const code = card.querySelector(".comparison-currency").value;

  addCurrencyToChart(card, code);

});
const prepareImageButton = document.querySelector("#prepare-image");
const shareImageButton = document.querySelector("#share-image");
const downloadPngButton = document.querySelector("#download-png");
const shareStatus = document.querySelector("#share-status");
const sharePreview = document.querySelector("#share-preview");

let preparedChartFile = null;
let preparedChartUrl = null;

prepareImageButton.addEventListener("click", async () => {
  const chart = document.querySelector("#history-chart");

  if (!chart.querySelector("svg")) {
    shareStatus.textContent = "Load the EUR–USD chart first.";
    return;
  }

  prepareImageButton.disabled = true;
  shareImageButton.disabled = true;
  downloadPngButton.disabled = true;
  preparedChartFile = null;
  sharePreview.hidden = true;
  shareStatus.textContent = "Preparing image…";

  try {
    if (!window.html2canvas) {
      throw new Error("The image library could not load.");
    }

    const chartCanvas = await html2canvas(chart, {
      backgroundColor: "#ffffff",
      scale: 2
    });

    // Add source attribution beneath the chart.
    const output = document.createElement("canvas");
    output.width = chartCanvas.width;
    output.height = chartCanvas.height + 80;

    const context = output.getContext("2d");

    if (!context) {
      throw new Error("Could not create the image.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(chartCanvas, 0, 0);

    context.fillStyle = "#182238";
    context.font = "24px sans-serif";
    context.fillText(
      "Source: Frankfurter | USD per EUR",
      20,
      output.height - 25
    );

    const blob = await new Promise(resolve =>
      output.toBlob(resolve, "image/png")
    );

    if (!blob) {
      throw new Error("Could not generate the PNG.");
    }

    preparedChartFile = new File(
      [blob],
      "money-portal-chart.png",
      { type: "image/png" }
    );

    if (preparedChartUrl) {
      URL.revokeObjectURL(preparedChartUrl);
    }

    preparedChartUrl = URL.createObjectURL(blob);
    sharePreview.src = preparedChartUrl;
    sharePreview.hidden = false;
    downloadPngButton.disabled = false;

    const supported =
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [preparedChartFile] });

    shareImageButton.disabled = !supported;

    shareStatus.textContent = supported
      ? "Image ready. Check the preview, then click Share image."
      : "Image ready. Direct file sharing is unavailable here. " +
        "Download the PNG and attach it manually.";
  } catch (error) {
    shareStatus.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    prepareImageButton.disabled = false;
  }
});

shareImageButton.addEventListener("click", async () => {
  if (!preparedChartFile) return;

  try {
    await navigator.share({
      title: "Money Portal chart",
      files: [preparedChartFile]
    });

    shareStatus.textContent =
      "Sharing request handed to the device.";
  } catch (error) {
    shareStatus.textContent = error.name === "AbortError"
      ? "Sharing cancelled or no sharing target available."
      : `Sharing failed: ${error.message}`;
  }
});

downloadPngButton.addEventListener("click", () => {
  if (!preparedChartUrl) return;

  const link = document.createElement("a");
  link.href = preparedChartUrl;
  link.download = "money-portal-chart.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
});
console.log("KPI code reached");
const refreshKpisButton = document.querySelector("#refresh-kpis");
const kpiStatus = document.querySelector("#kpi-status");

async function refreshMarketSummary() {
  refreshKpisButton.disabled = true;
  kpiStatus.textContent = "Updating market summary…";

  const coins = [
    ["BTC", "#kpi-btc"],
    ["ETH", "#kpi-eth"],
    ["DOGE", "#kpi-doge"]
  ];

  const jobs = coins.map(async ([symbol, selector]) => {
    const output = document.querySelector(selector);
    output.textContent = "Loading…";

    try {
      const response = await fetch(
        `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const price = Number(json.data?.amount);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Invalid price");
      }

      output.textContent = price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: symbol === "DOGE" ? 6 : 2
      });
    } catch (error) {
      output.textContent = "Unavailable";
      throw error;
    }
  });

  jobs.push((async () => {
    const output = document.querySelector("#kpi-sentiment");
    output.textContent = "Loading…";

    try {
      const response = await fetch(
        "https://api.alternative.me/fng/?limit=1"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const item = json.data?.[0];
      const score = Number(item?.value);

      if (
        json.metadata?.error ||
        !item ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > 100
      ) {
        throw new Error("Invalid sentiment data");
      }

      output.textContent =
        `${score}/100 · ${item.value_classification}`;
    } catch (error) {
      output.textContent = "Unavailable";
      throw error;
    }
  })());

  try {
    const results = await Promise.allSettled(jobs);
    const failed = results.filter(
      result => result.status === "rejected"
    ).length;

    kpiStatus.textContent =
      `${failed ? "Some data unavailable. " : ""}` +
      `Refresh completed at ${new Date().toLocaleTimeString()}. ` +
      "Prices: Coinbase (USD). Sentiment: Alternative.me.";
  } finally {
    refreshKpisButton.disabled = false;
  }
}

refreshKpisButton.addEventListener("click", refreshMarketSummary);
refreshMarketSummary();