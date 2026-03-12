import { useEffect, useMemo, useState } from "react";

export default function DailyMessingTracker() {
  const baseOptions = ["Breakfast", "Lunch", "Dinner", "Boikali", "Extra Messing"];
  const boikaliChoices = ["Grill", "French Fries", "Halim", "Misc."];
  const cigaretteChoices = ["Cigarette", "Coke", "Both"];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const ramadanMonthsByYear = {
    2023: [2, 3],
    2024: [2, 3],
    2025: [1, 2],
    2026: [1, 2],
    2027: [1, 2],
    2028: [0, 1],
    2029: [0, 1],
    2030: [0, 1],
  };

  const outLeaveChoices = ["", "Out", "Leave"];

  const today = new Date();
  const defaultMonth = today.getMonth();
  const defaultYear = today.getFullYear();
  const storagePrefix = "daily-messing-tracker-data";

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  const formatDateLabel = (year, month, day) => {
    const date = new Date(year, month, day);
    const dayString = String(day).padStart(2, "0");
    const weekday = weekdayNames[date.getDay()];
    return `${dayString}-${weekday}`;
  };

  const isRamadanMonth = (year, month) => {
    return ramadanMonthsByYear[year]?.includes(month) ?? false;
  };

  const getColumnLabel = (option, year, month) => {
    if (isRamadanMonth(year, month)) {
      if (option === "Breakfast") return "Seheri";
      if (option === "Lunch") return "Iftar";
    }
    return option;
  };

  const createInitialDayState = () => ({
    outLeaveStatus: "",
    Breakfast: false,
    Lunch: false,
    Dinner: false,
    Boikali: false,
    boikaliType: "",
    "Extra Messing": false,
    cigaretteUsed: false,
    cigaretteChoice: "",
    cigaretteCount: "",
  });

  const createInitialData = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1).reduce((acc, day) => {
      acc[day] = createInitialDayState();
      return acc;
    }, {});
  };

  const normalizeDayData = (savedDay) => {
    const base = createInitialDayState();
    if (!savedDay || typeof savedDay !== "object") return base;

    base.outLeaveStatus =
      savedDay.outLeaveStatus === "Out" || savedDay.outLeaveStatus === "Leave"
        ? savedDay.outLeaveStatus
        : "";
    base.Breakfast = Boolean(savedDay.Breakfast);
    base.Lunch = Boolean(savedDay.Lunch);
    base.Dinner = Boolean(savedDay.Dinner);
    base.Boikali = Boolean(savedDay.Boikali);
    base.boikaliType = typeof savedDay.boikaliType === "string" ? savedDay.boikaliType : "";
    base["Extra Messing"] = Boolean(savedDay["Extra Messing"]);
    base.cigaretteUsed = Boolean(savedDay.cigaretteUsed);
    base.cigaretteChoice = typeof savedDay.cigaretteChoice === "string" ? savedDay.cigaretteChoice : "";
    base.cigaretteCount =
      savedDay.cigaretteCount === "" || savedDay.cigaretteCount === undefined
        ? ""
        : String(savedDay.cigaretteCount);

    return base;
  };

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const storageKey = `${storagePrefix}-${selectedYear}-${selectedMonth}`;
  const days = useMemo(
    () => Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1),
    [selectedYear, selectedMonth]
  );

  const datedRows = useMemo(
    () =>
      days.map((day) => ({
        day,
        label: formatDateLabel(selectedYear, selectedMonth, day),
      })),
    [days, selectedYear, selectedMonth]
  );

  const [data, setData] = useState(() => {
    if (typeof window === "undefined") return createInitialData(defaultYear, defaultMonth);
    const key = `${storagePrefix}-${defaultYear}-${defaultMonth}`;
    const saved = window.localStorage.getItem(key);
    if (!saved) return createInitialData(defaultYear, defaultMonth);

    try {
      const parsed = JSON.parse(saved);
      const base = createInitialData(defaultYear, defaultMonth);
      Object.keys(base).forEach((day) => {
        base[day] = normalizeDayData(parsed?.[day]);
      });
      return base;
    } catch {
      return createInitialData(defaultYear, defaultMonth);
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      setData(createInitialData(selectedYear, selectedMonth));
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const base = createInitialData(selectedYear, selectedMonth);
      Object.keys(base).forEach((day) => {
        base[day] = normalizeDayData(parsed?.[day]);
      });
      setData(base);
    } catch {
      setData(createInitialData(selectedYear, selectedMonth));
    }
  }, [storageKey, selectedYear, selectedMonth]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, storageKey]);

  const handleOutLeaveChange = (day, value) => {
    setData((prev) => {
      const current = prev[day] ?? createInitialDayState();
      if (!value) {
        return {
          ...prev,
          [day]: {
            ...current,
            outLeaveStatus: "",
          },
        };
      }

      return {
        ...prev,
        [day]: {
          ...createInitialDayState(),
          outLeaveStatus: value,
        },
      };
    });
  };

  const handleToggle = (day, option) => {
    setData((prev) => {
      const current = prev[day] ?? createInitialDayState();
      if (current.outLeaveStatus) return prev;
      const nextValue = !current[option];
      return {
        ...prev,
        [day]: {
          ...current,
          [option]: nextValue,
          ...(option === "Boikali" && !nextValue ? { boikaliType: "" } : {}),
        },
      };
    });
  };

  const handleBoikaliTypeChange = (day, value) => {
    if (data?.[day]?.outLeaveStatus) return;
    setData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        Boikali: true,
        boikaliType: value,
      },
    }));
  };

  const handleCigaretteUsedToggle = (day) => {
    if (data?.[day]?.outLeaveStatus) return;
    setData((prev) => {
      const current = prev[day] ?? createInitialDayState();
      const nextUsed = !current.cigaretteUsed;
      return {
        ...prev,
        [day]: {
          ...current,
          cigaretteUsed: nextUsed,
          cigaretteChoice: nextUsed ? current.cigaretteChoice : "",
          cigaretteCount: nextUsed ? current.cigaretteCount : "",
        },
      };
    });
  };

  const handleCigaretteChoiceChange = (day, value) => {
    if (data?.[day]?.outLeaveStatus) return;
    setData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        cigaretteUsed: true,
        cigaretteChoice: value,
      },
    }));
  };

  const handleCigaretteCountChange = (day, value) => {
    if (data?.[day]?.outLeaveStatus) return;
    const cleaned = value.replace(/[^0-9]/g, "");
    setData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        cigaretteUsed: true,
        cigaretteCount: cleaned,
      },
    }));
  };

  const totals = useMemo(() => {
    return {
      Breakfast: days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.Breakfast ? 1 : 0),
        0
      ),
      Lunch: days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.Lunch ? 1 : 0),
        0
      ),
      Dinner: days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.Dinner ? 1 : 0),
        0
      ),
      Boikali: days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.Boikali ? 1 : 0),
        0
      ),
      "Extra Messing": days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.["Extra Messing"] ? 1 : 0),
        0
      ),
      cigaretteUsed: days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.cigaretteUsed ? 1 : 0),
        0
      ),
      cigaretteCount: days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : Number(data?.[day]?.cigaretteCount || 0)),
        0
      ),
    };
  }, [data, days]);

  const boikaliBreakdown = useMemo(() => {
    return boikaliChoices.reduce((acc, choice) => {
      acc[choice] = days.reduce(
        (sum, day) => sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.boikaliType === choice ? 1 : 0),
        0
      );
      return acc;
    }, {});
  }, [data, days]);

  const cigaretteTypeBreakdown = useMemo(() => {
    return cigaretteChoices.reduce((acc, choice) => {
      acc[choice] = days.reduce(
        (sum, day) =>
          sum + (data?.[day]?.outLeaveStatus ? 0 : data?.[day]?.cigaretteChoice === choice ? 1 : 0),
        0
      );
      return acc;
    }, {});
  }, [data, days]);

  const dailyTotals = useMemo(() => {
    return days.reduce((acc, day) => {
      const row = data?.[day] ?? createInitialDayState();
      if (row.outLeaveStatus) {
        acc[day] = 0;
        return acc;
      }
      const baseCount =
        (row.Breakfast ? 1 : 0) +
        (row.Lunch ? 1 : 0) +
        (row.Dinner ? 1 : 0) +
        (row.Boikali ? 1 : 0) +
        (row["Extra Messing"] ? 1 : 0) +
        (row.cigaretteUsed ? 1 : 0);
      acc[day] = baseCount;
      return acc;
    }, {});
  }, [data, days]);

  const grandTotal = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, value) => sum + value, 0);
  }, [dailyTotals]);

  const resetMonth = () => {
    setData(createInitialData(selectedYear, selectedMonth));
  };

  const exportToCSV = () => {
    const header = [
      "Date",
      "Out/Leave",
      getColumnLabel("Breakfast", selectedYear, selectedMonth),
      getColumnLabel("Lunch", selectedYear, selectedMonth),
      "Dinner",
      "Boikali",
      "Boikali Type",
      "Extra Messing",
      "Cigarette/Coke Used",
      "Cigarette/Coke Type",
      "Quantity",
      "Daily Total",
    ];

    const rows = datedRows.map(({ day, label }) => {
      const row = data?.[day] ?? createInitialDayState();
      return [
        label,
        row.outLeaveStatus || "",
        row.Breakfast ? "Yes" : row.outLeaveStatus || "No",
        row.Lunch ? "Yes" : row.outLeaveStatus || "No",
        row.Dinner ? "Yes" : row.outLeaveStatus || "No",
        row.Boikali ? "Yes" : row.outLeaveStatus || "No",
        row.boikaliType || (row.outLeaveStatus ? row.outLeaveStatus : ""),
        row["Extra Messing"] ? "Yes" : row.outLeaveStatus || "No",
        row.cigaretteUsed ? "Yes" : row.outLeaveStatus || "No",
        row.cigaretteChoice || (row.outLeaveStatus ? row.outLeaveStatus : ""),
        row.cigaretteCount || (row.outLeaveStatus ? row.outLeaveStatus : ""),
        dailyTotals[day],
      ];
    });

    const footer = [
      "Totals",
      "",
      totals.Breakfast,
      totals.Lunch,
      totals.Dinner,
      totals.Boikali,
      Object.entries(boikaliBreakdown)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" | "),
      totals["Extra Messing"],
      totals.cigaretteUsed,
      Object.entries(cigaretteTypeBreakdown)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" | "),
      totals.cigaretteCount,
      grandTotal,
    ];

    const csvContent = [header, ...rows, footer]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileMonth = monthNames[selectedMonth].toLowerCase();
    link.href = url;
    link.setAttribute("download", `messing-tracker-${fileMonth}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const yearOptions = Array.from({ length: 10 }, (_, i) => defaultYear - 4 + i);

  const [mobileView, setMobileView] = useState("daily");

  const [selectedDay, setSelectedDay] = useState(() => {
    const todayDay = today.getDate();
    return todayDay <= getDaysInMonth(defaultYear, defaultMonth) ? todayDay : 1;
  });

  useEffect(() => {
    const maxDay = getDaysInMonth(selectedYear, selectedMonth);
    setSelectedDay((prev) => (prev > maxDay ? maxDay : prev));
  }, [selectedMonth, selectedYear]);

  const selectedDayData = data?.[selectedDay] ?? createInitialDayState();
  const selectedDateLabel = formatDateLabel(selectedYear, selectedMonth, selectedDay);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[96rem]">
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">Daily Messing Tracker</h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Ramadan months automatically relabel Breakfast as Seheri and Lunch as Iftar. Out/Leave days lock the row and are excluded from totals.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-700"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-700"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <button
                onClick={exportToCSV}
                className="rounded-2xl border px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Export CSV
              </button>

              <button
                onClick={resetMonth}
                className="rounded-2xl border px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Reset Month
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly Total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{grandTotal}</p>
              <p className="mt-1 text-sm text-slate-500">{monthNames[selectedMonth]} {selectedYear} • {days.length} days</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Date</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{selectedDateLabel}</p>
              <p className="mt-1 text-sm text-slate-500">Daily total: {dailyTotals[selectedDay] || 0}</p>
              {selectedDayData.outLeaveStatus ? (
                <p className="mt-1 text-sm font-medium text-amber-600">{selectedDayData.outLeaveStatus} day</p>
              ) : null}
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cigarette/Coke Qty</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totals.cigaretteCount}</p>
              <p className="mt-1 text-sm text-slate-500">Total quantity this month</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Jump</p>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-700"
              >
                {datedRows.map(({ day, label }) => (
                  <option key={day} value={day}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Mobile Summary</h2>
              <span className="text-sm text-slate-500">Swipe table below for full month</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-600">{getColumnLabel("Breakfast", selectedYear, selectedMonth)}</p><p className="text-2xl font-bold text-slate-900">{totals.Breakfast}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-600">{getColumnLabel("Lunch", selectedYear, selectedMonth)}</p><p className="text-2xl font-bold text-slate-900">{totals.Lunch}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-600">Dinner</p><p className="text-2xl font-bold text-slate-900">{totals.Dinner}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-600">Boikali</p><p className="text-2xl font-bold text-slate-900">{totals.Boikali}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-600">Extra Messing</p><p className="text-2xl font-bold text-slate-900">{totals["Extra Messing"]}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-600">Cigarette/Coke</p><p className="text-2xl font-bold text-slate-900">{totals.cigaretteUsed}</p></div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm md:hidden">
            <div className="mb-4 flex gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMobileView("daily")}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${mobileView === "daily" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                Daily View
              </button>
              <button
                type="button"
                onClick={() => setMobileView("monthly")}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${mobileView === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                Monthly View
              </button>
            </div>

            {mobileView === "daily" ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">Selected Day Details</h2>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))} className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700">Prev</button>
                    <button type="button" onClick={() => setSelectedDay((prev) => Math.min(days.length, prev + 1))} className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700">Next</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 font-medium text-slate-800">Out/Leave</p>
                    <select
                      value={selectedDayData.outLeaveStatus}
                      onChange={(e) => handleOutLeaveChange(selectedDay, e.target.value)}
                      className="w-full rounded-xl border bg-white px-3 py-3 text-sm text-slate-700"
                    >
                      <option value="">None</option>
                      <option value="Out">Out</option>
                      <option value="Leave">Leave</option>
                    </select>
                    {selectedDayData.outLeaveStatus ? (
                      <p className="mt-2 text-xs text-amber-600">This day is locked and excluded from totals.</p>
                    ) : null}
                  </div>

                  {baseOptions.map((option) => (
                    <div key={`mobile-${option}`} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-800">{getColumnLabel(option, selectedYear, selectedMonth)}</p>
                          {option === "Boikali" && selectedDayData.Boikali && selectedDayData.boikaliType ? <p className="text-xs text-slate-500">{selectedDayData.boikaliType}</p> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle(selectedDay, option)}
                          disabled={Boolean(selectedDayData.outLeaveStatus)}
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition ${selectedDayData.outLeaveStatus ? "border-amber-300 bg-amber-50 text-amber-600" : selectedDayData[option] ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-400"}`}
                        >
                          {selectedDayData.outLeaveStatus ? selectedDayData.outLeaveStatus : selectedDayData[option] ? "✓" : ""}
                        </button>
                      </div>
                      {option === "Boikali" && selectedDayData.Boikali && !selectedDayData.outLeaveStatus ? (
                        <select value={selectedDayData.boikaliType} onChange={(e) => handleBoikaliTypeChange(selectedDay, e.target.value)} className="mt-3 w-full rounded-xl border bg-white px-3 py-3 text-sm text-slate-700">
                          <option value="">Select item</option>
                          {boikaliChoices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                        </select>
                      ) : null}
                    </div>
                  ))}

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-800">Cigarette/Coke</p>
                      <button
                        type="button"
                        onClick={() => handleCigaretteUsedToggle(selectedDay)}
                        disabled={Boolean(selectedDayData.outLeaveStatus)}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition ${selectedDayData.outLeaveStatus ? "border-amber-300 bg-amber-50 text-amber-600" : selectedDayData.cigaretteUsed ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-400"}`}
                      >
                        {selectedDayData.outLeaveStatus ? selectedDayData.outLeaveStatus : selectedDayData.cigaretteUsed ? "✓" : ""}
                      </button>
                    </div>
                    {selectedDayData.cigaretteUsed && !selectedDayData.outLeaveStatus ? (
                      <div className="mt-3 grid gap-3">
                        <select value={selectedDayData.cigaretteChoice} onChange={(e) => handleCigaretteChoiceChange(selectedDay, e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm text-slate-700">
                          <option value="">Choose type</option>
                          {cigaretteChoices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                        </select>
                        <input type="text" inputMode="numeric" value={selectedDayData.cigaretteCount} onChange={(e) => handleCigaretteCountChange(selectedDay, e.target.value)} placeholder="Quantity" className="w-full rounded-xl border bg-white px-3 py-3 text-sm text-slate-700" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">Monthly Register</h2>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    Print
                  </button>
                </div>
                <div className="overflow-auto rounded-2xl border">
                  <table className="min-w-[900px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="sticky left-0 top-0 z-30 border-b border-r bg-slate-100 px-3 py-3 text-left font-semibold text-slate-700">
                          Date
                        </th>
                        {baseOptions.map((option) => (
                          <th
                            key={`mobile-month-${option}`}
                            className="sticky top-0 z-20 min-w-[140px] border-b bg-slate-100 px-3 py-3 text-center font-semibold text-slate-700"
                          >
                            {getColumnLabel(option, selectedYear, selectedMonth)}
                          </th>
                        ))}
                        <th className="sticky top-0 z-20 min-w-[220px] border-b bg-slate-100 px-3 py-3 text-center font-semibold text-slate-700">
                          Cigarette/Coke
                        </th>
                        <th className="sticky top-0 z-20 min-w-[100px] border-b bg-slate-100 px-3 py-3 text-center font-semibold text-slate-700">
                          Daily Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {datedRows.map(({ day, label }) => {
                        const row = data?.[day] ?? createInitialDayState();
                        return (
                          <tr key={`mobile-row-${day}`} className="odd:bg-white even:bg-slate-50">
                            <td className="sticky left-0 z-10 border-r border-b bg-inherit px-3 py-3 font-medium text-slate-700 whitespace-nowrap">
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-end">
                                  <select
                                    value={row.outLeaveStatus}
                                    onChange={(e) => handleOutLeaveChange(day, e.target.value)}
                                    className="w-[88px] rounded-lg border bg-white px-2 py-1 text-[11px] font-medium text-slate-700"
                                  >
                                    <option value="">Out/Leave</option>
                                    <option value="Out">Out</option>
                                    <option value="Leave">Leave</option>
                                  </select>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span>{label}</span>
                                  {row.outLeaveStatus ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                      {row.outLeaveStatus}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            {baseOptions.map((option) => {
                              const isBoikali = option === "Boikali";
                              return (
                                <td key={`mobile-cell-${day}-${option}`} className="border-b px-2 py-2 text-center align-top">
                                  <div className="flex flex-col items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggle(day, option)}
                                      disabled={Boolean(row.outLeaveStatus)}
                                      className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition ${row.outLeaveStatus ? "border-amber-300 bg-amber-50 text-amber-600" : row[option] ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-400"}`}
                                    >
                                      {row.outLeaveStatus ? row.outLeaveStatus : row[option] ? "✓" : ""}
                                    </button>
                                    {isBoikali && row.Boikali && !row.outLeaveStatus ? (
                                      <select
                                        value={row.boikaliType}
                                        onChange={(e) => handleBoikaliTypeChange(day, e.target.value)}
                                        className="w-full rounded-xl border bg-white px-2 py-2 text-xs text-slate-700"
                                      >
                                        <option value="">Select item</option>
                                        {boikaliChoices.map((choice) => (
                                          <option key={choice} value={choice}>
                                            {choice}
                                          </option>
                                        ))}
                                      </select>
                                    ) : null}
                                  </div>
                                </td>
                              );
                            })}

                            <td className="border-b px-2 py-2 align-top">
                              <div className="flex min-w-[200px] flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCigaretteUsedToggle(day)}
                                  disabled={Boolean(row.outLeaveStatus)}
                                  className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition ${row.outLeaveStatus ? "border-amber-300 bg-amber-50 text-amber-600" : row.cigaretteUsed ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-400"}`}
                                >
                                  {row.outLeaveStatus ? row.outLeaveStatus : row.cigaretteUsed ? "✓" : ""}
                                </button>
                                {row.cigaretteUsed && !row.outLeaveStatus ? (
                                  <>
                                    <select
                                      value={row.cigaretteChoice}
                                      onChange={(e) => handleCigaretteChoiceChange(day, e.target.value)}
                                      className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700"
                                    >
                                      <option value="">Choose type</option>
                                      {cigaretteChoices.map((choice) => (
                                        <option key={choice} value={choice}>
                                          {choice}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={row.cigaretteCount}
                                      onChange={(e) => handleCigaretteCountChange(day, e.target.value)}
                                      placeholder="Quantity"
                                      className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700"
                                    />
                                  </>
                                ) : null}
                              </div>
                            </td>

                            <td className="border-b px-3 py-3 text-center font-semibold text-slate-700">
                              {dailyTotals[day]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100">
                        <td className="sticky left-0 z-10 border-r bg-slate-100 px-3 py-3 font-semibold text-slate-800">
                          Totals
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{totals.Breakfast}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{totals.Lunch}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{totals.Dinner}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{totals.Boikali}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{totals["Extra Messing"]}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">
                          <div>{totals.cigaretteUsed} days</div>
                          <div className="text-xs font-medium text-slate-600">Qty {totals.cigaretteCount}</div>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{grandTotal}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-800">
              {monthNames[selectedMonth]} {selectedYear} Register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sticky headers, Ramadan-aware labels, Out/Leave locking, Boikali detail dropdowns, and Cigarette/Coke selection with quantity.
            </p>
          </div>

          <div className="hidden md:block max-h-[70vh] overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="sticky left-0 top-0 z-30 border-b border-r bg-slate-100 px-3 py-3 text-left font-semibold text-slate-700 sm:px-4">
                    Date
                  </th>
                  {baseOptions.map((option) => (
                    <th
                      key={option}
                      className="sticky top-0 z-20 min-w-[150px] border-b bg-slate-100 px-3 py-3 text-center font-semibold text-slate-700 sm:min-w-[170px] sm:px-4"
                    >
                      {getColumnLabel(option, selectedYear, selectedMonth)}
                    </th>
                  ))}
                  <th className="sticky top-0 z-20 min-w-[240px] border-b bg-slate-100 px-3 py-3 text-center font-semibold text-slate-700 sm:px-4">
                    Cigarette/Coke
                  </th>
                  <th className="sticky top-0 z-20 min-w-[100px] border-b bg-slate-100 px-3 py-3 text-center font-semibold text-slate-700 sm:px-4">
                    Daily Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {datedRows.map(({ day, label }) => {
                  const row = data?.[day] ?? createInitialDayState();
                  return (
                    <tr key={day} className="odd:bg-white even:bg-slate-50">
                      <td className="sticky left-0 z-10 border-r border-b bg-inherit px-3 py-3 font-medium text-slate-700 whitespace-nowrap sm:px-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-end">
                            <select
                              value={row.outLeaveStatus}
                              onChange={(e) => handleOutLeaveChange(day, e.target.value)}
                              className="w-[88px] rounded-lg border bg-white px-2 py-1 text-[11px] font-medium text-slate-700"
                            >
                              <option value="">Out/Leave</option>
                              <option value="Out">Out</option>
                              <option value="Leave">Leave</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>{label}</span>
                            {row.outLeaveStatus ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                {row.outLeaveStatus}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {baseOptions.map((option) => {
                        const isBoikali = option === "Boikali";
                        return (
                          <td key={`${day}-${option}`} className="border-b px-2 py-2 text-center align-top sm:px-3 sm:py-3">
                            <div className="flex flex-col items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggle(day, option)}
                                disabled={Boolean(row.outLeaveStatus)}
                                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition sm:h-12 sm:w-12 ${row.outLeaveStatus ? "border-amber-300 bg-amber-50 text-amber-600" : row[option] ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-400 hover:bg-slate-100"}`}
                                aria-label={`${option} on day ${day}`}
                                aria-pressed={row[option]}
                              >
                                {row.outLeaveStatus ? row.outLeaveStatus : row[option] ? "✓" : ""}
                              </button>

                              {isBoikali && row.Boikali && !row.outLeaveStatus ? (
                                <select
                                  value={row.boikaliType}
                                  onChange={(e) => handleBoikaliTypeChange(day, e.target.value)}
                                  className="w-full rounded-xl border bg-white px-2 py-2 text-xs text-slate-700"
                                >
                                  <option value="">Select item</option>
                                  {boikaliChoices.map((choice) => (
                                    <option key={choice} value={choice}>
                                      {choice}
                                    </option>
                                  ))}
                                </select>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}

                      <td className="border-b px-2 py-2 align-top sm:px-3 sm:py-3">
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleCigaretteUsedToggle(day)}
                            disabled={Boolean(row.outLeaveStatus)}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition ${row.outLeaveStatus ? "border-amber-300 bg-amber-50 text-amber-600" : row.cigaretteUsed ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-400 hover:bg-slate-100"}`}
                            aria-label={`Cigarette or Coke on day ${day}`}
                            aria-pressed={row.cigaretteUsed}
                          >
                            {row.outLeaveStatus ? row.outLeaveStatus : row.cigaretteUsed ? "✓" : ""}
                          </button>

                          {row.cigaretteUsed && !row.outLeaveStatus ? (
                            <>
                              <select
                                value={row.cigaretteChoice}
                                onChange={(e) => handleCigaretteChoiceChange(day, e.target.value)}
                                className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700"
                              >
                                <option value="">Choose type</option>
                                {cigaretteChoices.map((choice) => (
                                  <option key={choice} value={choice}>
                                    {choice}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                inputMode="numeric"
                                value={row.cigaretteCount}
                                onChange={(e) => handleCigaretteCountChange(day, e.target.value)}
                                placeholder="Quantity"
                                className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700"
                              />
                            </>
                          ) : null}
                        </div>
                      </td>

                      <td className="border-b px-3 py-3 text-center font-semibold text-slate-700 sm:px-4">
                        {dailyTotals[day]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100">
                  <td className="sticky left-0 z-10 border-r bg-slate-100 px-3 py-3 font-semibold text-slate-800 sm:px-4">
                    Totals
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 sm:px-4">{totals.Breakfast}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 sm:px-4">{totals.Lunch}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 sm:px-4">{totals.Dinner}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 sm:px-4">{totals.Boikali}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 sm:px-4">{totals["Extra Messing"]}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 sm:px-4">
                    <div>{totals.cigaretteUsed} days</div>
                    <div className="text-xs font-medium text-slate-600">Qty {totals.cigaretteCount}</div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 sm:px-4">{grandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Ramadan-aware headers</h2>
            <p className="mt-2 text-sm text-slate-600">
              In Ramadan months for the selected year, Breakfast becomes Seheri and Lunch becomes Iftar automatically.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Out/Leave locking</h2>
            <p className="mt-2 text-sm text-slate-600">
              When Out or Leave is selected for a date, that full day is locked and excluded from all totals.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Cigarette/Coke detail</h2>
            <p className="mt-2 text-sm text-slate-600">
              The rightmost column lets you mark usage, choose Cigarette, Coke, or Both, and enter quantity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}