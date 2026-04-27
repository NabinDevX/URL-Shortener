(() => {
  const analyticsRoot = document.querySelector("[data-analytics-page-data]");
  const analyticsData = analyticsRoot?.dataset.analyticsPageData
    ? JSON.parse(decodeURIComponent(analyticsRoot.dataset.analyticsPageData))
    : {
        totalClicks: 0,
        activeLinks: 0,
        totalUrls: 0,
        last30DaysClicks: { labels: [], values: [] },
        radar: { labels: [], values: [] },
        topUrls: [],
      };

  const canvas = document.getElementById("analyticsChartCanvas");
  const toggleButtons = Array.from(
    document.querySelectorAll("[data-chart-toggle]")
  );
  const titleNode = document.getElementById("analyticsChartTitle");
  const subtitleNode = document.getElementById("analyticsChartSubtitle");
  const valueNode = document.getElementById("analyticsChartValue");
  const captionNode = document.getElementById("analyticsChartCaption");
  const secondaryValueNode = document.getElementById(
    "analyticsChartSecondaryValue"
  );
  const secondaryLabelNode = document.getElementById(
    "analyticsChartSecondaryLabel"
  );

  if (!canvas || !window.Chart) {
    return;
  }

  const chartColors = {
    primary: "rgba(114, 131, 255, 0.92)",
    primarySoft: "rgba(114, 131, 255, 0.18)",
    tertiary: "rgba(245, 182, 70, 0.9)",
    surface: "rgba(255, 255, 255, 0.18)",
    axis: "rgba(148, 163, 184, 0.35)",
    text: "rgba(226, 232, 240, 0.92)",
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
  };

  const getPeakClicks = () => {
    return analyticsData.last30DaysClicks.values.reduce(
      (maxValue, value) => Math.max(maxValue, Number(value || 0)),
      0
    );
  };

  const getAverageRadarScore = () => {
    const values = analyticsData.radar.values || [];
    if (!values.length) {
      return 0;
    }

    const sum = values.reduce((total, value) => total + Number(value || 0), 0);
    return Math.round(sum / values.length);
  };

  const updateModeMeta = (mode) => {
    if (mode === "radar") {
      if (titleNode) titleNode.textContent = "Audience Mix";
      if (subtitleNode) {
        subtitleNode.textContent =
          "Radar metrics from available visit metadata and click behavior";
      }
      if (valueNode) valueNode.textContent = `${getAverageRadarScore()}%`;
      if (captionNode) captionNode.textContent = "Average radar score";
      if (secondaryValueNode) {
        const returnVisitors = analyticsData.radar.values?.[5] || 0;
        secondaryValueNode.textContent = `${returnVisitors}%`;
      }
      if (secondaryLabelNode)
        secondaryLabelNode.textContent = "Return visitors";
      return;
    }

    if (titleNode) titleNode.textContent = "Click Distribution";
    if (subtitleNode) {
      subtitleNode.textContent = "Daily clicks over the last 30 days";
    }
    if (valueNode)
      valueNode.textContent = formatNumber(analyticsData.totalClicks);
    if (captionNode) captionNode.textContent = "Total clicks";
    if (secondaryValueNode)
      secondaryValueNode.textContent = formatNumber(getPeakClicks());
    if (secondaryLabelNode) secondaryLabelNode.textContent = "Peak day";
  };

  const setActiveButton = (mode) => {
    toggleButtons.forEach((button) => {
      const isActive = button.getAttribute("data-chart-toggle") === mode;
      button.classList.toggle("bg-surface-container-lowest", isActive);
      button.classList.toggle("shadow-sm", isActive);
      button.classList.toggle("rounded-lg", isActive);
      button.classList.toggle("text-primary", isActive);
      button.classList.toggle("text-on-surface-variant", !isActive);
    });
  };

  const createBarConfig = () => ({
    type: "bar",
    data: {
      labels: analyticsData.last30DaysClicks.labels || [],
      datasets: [
        {
          label: "Clicks",
          data: analyticsData.last30DaysClicks.values || [],
          borderRadius: 14,
          borderSkipped: false,
          backgroundColor: chartColors.primary,
          hoverBackgroundColor: chartColors.tertiary,
          maxBarThickness: 30,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#e2e8f0",
          padding: 12,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: chartColors.text,
            maxRotation: 0,
            autoSkip: true,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.axis,
          },
          ticks: {
            color: chartColors.text,
            precision: 0,
          },
        },
      },
    },
  });

  const createRadarConfig = () => ({
    type: "radar",
    data: {
      labels: analyticsData.radar.labels || [],
      datasets: [
        {
          label: "Audience mix",
          data: analyticsData.radar.values || [],
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primarySoft,
          pointBackgroundColor: chartColors.tertiary,
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: chartColors.tertiary,
          borderWidth: 2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: chartColors.text,
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#e2e8f0",
          padding: 12,
        },
      },
      scales: {
        r: {
          angleLines: {
            color: chartColors.axis,
          },
          grid: {
            color: chartColors.axis,
          },
          pointLabels: {
            color: chartColors.text,
            font: {
              size: 11,
              weight: 700,
            },
          },
          ticks: {
            backdropColor: "transparent",
            color: chartColors.text,
            showLabelBackdrop: false,
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    },
  });

  let activeMode = "bar";
  let activeChart = null;

  const renderChart = (mode) => {
    if (activeChart) {
      activeChart.destroy();
      activeChart = null;
    }

    activeMode = mode;
    setActiveButton(mode);
    updateModeMeta(mode);
    activeChart = new window.Chart(
      canvas,
      mode === "radar" ? createRadarConfig() : createBarConfig()
    );
  };

  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-chart-toggle") || "bar";
      if (mode !== activeMode) {
        renderChart(mode);
      }
    });
  });

  window.addEventListener("app:navigate", () => {
    if (activeChart) {
      activeChart.destroy();
      activeChart = null;
    }
  });

  renderChart("bar");
})();
