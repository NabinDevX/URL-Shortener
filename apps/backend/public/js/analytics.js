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
  const chartModeStorageKey = "analytics-chart-mode";

  if (!canvas || !window.Chart) {
    return;
  }

  const isDarkMode = document.documentElement.classList.contains("dark");

  const chartColors = isDarkMode
    ? {
        primary: "rgba(114, 131, 255, 0.96)",
        primarySoft: "rgba(114, 131, 255, 0.22)",
        tertiary: "rgba(245, 182, 70, 0.95)",
        axis: "rgba(148, 163, 184, 0.25)",
        axisStrong: "rgba(148, 163, 184, 0.45)",
        text: "rgba(226, 232, 240, 0.92)",
        mutedText: "rgba(203, 213, 225, 0.72)",
        tooltipBg: "rgba(15, 23, 42, 0.96)",
        tooltipTitle: "#ffffff",
        tooltipBody: "#e2e8f0",
      }
    : {
        primary: "rgba(79, 70, 229, 0.96)",
        primarySoft: "rgba(79, 70, 229, 0.16)",
        tertiary: "rgba(217, 119, 6, 0.95)",
        axis: "rgba(148, 163, 184, 0.18)",
        axisStrong: "rgba(148, 163, 184, 0.38)",
        text: "rgba(30, 41, 59, 0.92)",
        mutedText: "rgba(71, 85, 105, 0.8)",
        tooltipBg: "rgba(15, 23, 42, 0.96)",
        tooltipTitle: "#ffffff",
        tooltipBody: "#e2e8f0",
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

  const formatTickValue = (value) => {
    const numericValue = Number(value || 0);
    if (numericValue >= 1000) {
      return `${Math.round(numericValue / 100) / 10}k`;
    }

    return String(Math.round(numericValue));
  };

  const makeVerticalGradient = (context) => {
    const { chart } = context;
    const { ctx, chartArea } = chart;

    if (!chartArea) {
      return chartColors.primary;
    }

    const gradient = ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom
    );
    gradient.addColorStop(0, chartColors.primary);
    gradient.addColorStop(1, chartColors.primarySoft);
    return gradient;
  };

  const makeRadarGradient = (context) => {
    const { chart } = context;
    const { ctx, chartArea } = chart;

    if (!chartArea) {
      return chartColors.primarySoft;
    }

    const centerX = chartArea.left + chartArea.width / 2;
    const centerY = chartArea.top + chartArea.height / 2;
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(chartArea.width, chartArea.height) / 1.6
    );
    gradient.addColorStop(0, chartColors.primarySoft);
    gradient.addColorStop(1, "rgba(79, 70, 229, 0.02)");
    return gradient;
  };

  const createBarConfig = () => ({
    type: "bar",
    data: {
      labels: analyticsData.last30DaysClicks.labels || [],
      datasets: [
        {
          label: "Clicks",
          data: analyticsData.last30DaysClicks.values || [],
          borderRadius: 18,
          borderSkipped: false,
          backgroundColor: makeVerticalGradient,
          borderColor: chartColors.primary,
          borderWidth: 1,
          hoverBackgroundColor: chartColors.tertiary,
          maxBarThickness: 28,
          barPercentage: 0.68,
          categoryPercentage: 0.7,
          inflateAmount: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      layout: {
        padding: {
          top: 8,
          right: 8,
          bottom: 4,
          left: 4,
        },
      },
      animation: {
        duration: 1100,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: chartColors.tooltipBg,
          titleColor: chartColors.tooltipTitle,
          bodyColor: chartColors.tooltipBody,
          padding: 14,
          cornerRadius: 14,
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
            padding: 10,
            font: {
              size: 11,
              weight: 600,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.axis,
            drawBorder: false,
          },
          ticks: {
            color: chartColors.text,
            precision: 0,
            padding: 10,
            font: {
              size: 11,
              weight: 600,
            },
            callback: formatTickValue,
          },
        },
      },
      elements: {
        bar: {
          borderRadius: 18,
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
          backgroundColor: makeRadarGradient,
          pointBackgroundColor: chartColors.tertiary,
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: chartColors.tertiary,
          borderWidth: 3,
          fill: true,
          tension: 0.25,
          pointRadius: 3.5,
          pointHoverRadius: 5,
          pointHitRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 12,
      },
      plugins: {
        legend: {
          labels: {
            color: chartColors.text,
            usePointStyle: true,
            pointStyle: "circle",
            padding: 18,
          },
        },
        tooltip: {
          backgroundColor: chartColors.tooltipBg,
          titleColor: chartColors.tooltipTitle,
          bodyColor: chartColors.tooltipBody,
          padding: 14,
          cornerRadius: 14,
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          angleLines: {
            color: chartColors.axisStrong,
            lineWidth: 1,
          },
          grid: {
            color: chartColors.axis,
            circular: false,
          },
          pointLabels: {
            color: chartColors.mutedText,
            font: {
              size: 12,
              weight: 700,
            },
          },
          ticks: {
            backdropColor: "transparent",
            color: chartColors.mutedText,
            showLabelBackdrop: false,
            font: {
              size: 10,
              weight: 600,
            },
          },
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
    try {
      window.localStorage.setItem(chartModeStorageKey, mode);
    } catch {
      // ignore storage failures
    }
    setActiveButton(mode);
    updateModeMeta(mode);
    activeChart = new window.Chart(
      canvas,
      mode === "radar" ? createRadarConfig() : createBarConfig()
    );
  };

  const scheduleInitialRender = () => {
    window.requestAnimationFrame(() => {
      let initialMode = "bar";

      try {
        const storedMode = window.localStorage.getItem(chartModeStorageKey);
        if (storedMode === "bar" || storedMode === "radar") {
          initialMode = storedMode;
        }
      } catch {
        // ignore storage failures
      }

      renderChart(initialMode);
    });
  };

  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-chart-toggle") || "bar";
      if (mode !== activeMode) {
        renderChart(mode);
      }
    });
  });

  let handledInitialSpaNavigation = false;

  window.addEventListener("app:navigate", () => {
    if (!handledInitialSpaNavigation) {
      handledInitialSpaNavigation = true;
      return;
    }

    if (activeChart) {
      activeChart.destroy();
      activeChart = null;
    }
  });

  scheduleInitialRender();
})();
