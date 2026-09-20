import React, { useState, useEffect, useMemo, useCallback } from "react";
import { attendanceService } from "../services/attendanceService.js";
import { useToast } from "../context/ToastContext.jsx";
import { SearchInput } from "../components/ui/SearchInput.jsx";
import { FilterChip } from "../components/ui/FilterChip.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { fmtD, daysInMonth, monthKey } from "../utils/dates.js";
import {
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  UserCheck,
  Users,
} from "lucide-react";

export const AttendancePage = () => {
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const toast = useToast();

  const loadDailyAttendance = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await attendanceService.getDaily(date);
      setDailyData(res?.records || []);
    } catch (err) {
      toast.error("Failed to load daily attendance");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadMonthlyAttendance = useCallback(async (month) => {
    setLoading(true);
    try {
      const res = await attendanceService.getMonthly(month);
      setMonthlyData(res?.drivers || []);
    } catch (err) {
      toast.error("Failed to load monthly attendance sheet");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (viewMode === "daily") {
      loadDailyAttendance(selectedDate);
    } else {
      loadMonthlyAttendance(selectedMonth);
    }
  }, [viewMode, selectedDate, selectedMonth, loadDailyAttendance, loadMonthlyAttendance]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(today);
    setSelectedMonth(today.slice(0, 7));
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = prevDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = nextDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
  };

  // Single Driver Attendance Marking
  const handleMarkDaily = async (driverId, newStatus) => {
    // Optimistic state update
    setDailyData((prev) =>
      prev.map((r) =>
        r.driverId === driverId ? { ...r, status: newStatus } : r
      )
    );

    try {
      await attendanceService.record({
        driverId,
        date: selectedDate,
        status: newStatus,
      });
    } catch (err) {
      toast.error("Failed to update attendance");
      loadDailyAttendance(selectedDate);
    }
  };

  // Mark all unmarked as Present
  const handleMarkAllPresent = async () => {
    const unmarked = dailyData.filter((r) => r.status === "UNMARKED" || !r.status);
    if (unmarked.length === 0) {
      toast.info("All drivers are already marked for this date");
      return;
    }

    setSaving(true);
    // Optimistic update
    setDailyData((prev) =>
      prev.map((r) =>
        r.status === "UNMARKED" || !r.status ? { ...r, status: "PRESENT" } : r
      )
    );

    try {
      const records = unmarked.map((r) => ({
        driverId: r.driverId,
        status: "PRESENT",
      }));
      await attendanceService.recordBulk(selectedDate, records);
      toast.success(`Marked ${records.length} drivers as Present`);
    } catch (err) {
      toast.error("Failed to mark all present");
      loadDailyAttendance(selectedDate);
    } finally {
      setSaving(false);
    }
  };

  // Mark in Monthly Matrix
  const handleCycleMonthlyCell = async (driverId, day) => {
    const currentDriver = monthlyData.find((d) => d.driverId === driverId);
    const currentStatus = currentDriver?.days?.[day]?.status || "UNMARKED";

    const cycle = {
      UNMARKED: "PRESENT",
      PRESENT: "ABSENT",
      ABSENT: "LEAVE",
      LEAVE: "UNMARKED",
    };
    const nextStatus = cycle[currentStatus] || "PRESENT";

    const formattedDay = String(day).padStart(2, "0");
    const fullDate = `${selectedMonth}-${formattedDay}`;

    // Optimistic update
    setMonthlyData((prev) =>
      prev.map((d) => {
        if (d.driverId !== driverId) return d;
        const newDays = { ...d.days };
        if (nextStatus === "UNMARKED") {
          delete newDays[day];
        } else {
          newDays[day] = { status: nextStatus };
        }

        // Recalculate summary
        let p = 0, a = 0, l = 0;
        Object.values(newDays).forEach((v) => {
          if (v.status === "PRESENT") p++;
          else if (v.status === "ABSENT") a++;
          else if (v.status === "LEAVE") l++;
        });

        return {
          ...d,
          days: newDays,
          summary: { present: p, absent: a, leave: l },
        };
      })
    );

    try {
      await attendanceService.record({
        driverId,
        date: fullDate,
        status: nextStatus,
      });
    } catch (err) {
      toast.error("Failed to update attendance");
      loadMonthlyAttendance(selectedMonth);
    }
  };

  // Filtered Daily Data
  const filteredDaily = useMemo(() => {
    return dailyData.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.mobile || "").toLowerCase().includes(q) ||
        (r.assignedVehicle?.vehicleNo || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "present") return r.status === "PRESENT";
      if (statusFilter === "absent") return r.status === "ABSENT";
      if (statusFilter === "leave") return r.status === "LEAVE";
      if (statusFilter === "unmarked") return r.status === "UNMARKED" || !r.status;
      return true;
    });
  }, [dailyData, searchQuery, statusFilter]);

  // Counts for Daily Roster
  const dailyCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let unmarked = 0;

    dailyData.forEach((r) => {
      if (r.status === "PRESENT") present++;
      else if (r.status === "ABSENT") absent++;
      else if (r.status === "LEAVE") leave++;
      else unmarked++;
    });

    return {
      total: dailyData.length,
      present,
      absent,
      leave,
      unmarked,
    };
  }, [dailyData]);

  // Filtered Monthly Data
  const filteredMonthly = useMemo(() => {
    return monthlyData.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        (d.name || "").toLowerCase().includes(q) ||
        (d.mobile || "").toLowerCase().includes(q) ||
        (d.assignedVehicle?.vehicleNo || "").toLowerCase().includes(q)
      );
    });
  }, [monthlyData, searchQuery]);

  const curMonthDays = daysInMonth(selectedMonth);
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const isSelectedDateToday = selectedDate === todayDateStr;

  return (
    <div className="space-y-4">
      {/* Top Toolbar & Date Controls */}
      <div className="panel panel-pad bg-paper-raised flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-paper-subtle rounded-lg border border-line w-fit">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              viewMode === "daily"
                ? "bg-ink text-white shadow-sm font-semibold"
                : "text-slate hover:text-ink"
            }`}
          >
            Daily Roster
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              viewMode === "monthly"
                ? "bg-ink text-white shadow-sm font-semibold"
                : "text-slate hover:text-ink"
            }`}
          >
            Monthly Sheet
          </button>
        </div>

        {/* Date / Month Picker Navigation */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {viewMode === "daily" ? (
            <div className="flex items-center gap-1.5 bg-paper-subtle p-1 rounded-lg border border-line">
              <button
                type="button"
                onClick={handlePrevDay}
                aria-label="Previous day"
                className="p-1.5 rounded hover:bg-paper-muted text-slate hover:text-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field py-1 px-2.5 text-[13px] font-mono bg-paper-raised border-line font-semibold"
              />
              <button
                type="button"
                onClick={handleNextDay}
                aria-label="Next day"
                className="p-1.5 rounded hover:bg-paper-muted text-slate hover:text-ink transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isSelectedDateToday && (
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2.5 py-1 rounded text-[12px] font-medium text-teal hover:bg-teal-soft/40 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-paper-subtle p-1 rounded-lg border border-line">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1.5 rounded hover:bg-paper-muted text-slate hover:text-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field py-1 px-2.5 text-[13px] font-mono bg-paper-raised border-line font-semibold"
              />
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1.5 rounded hover:bg-paper-muted text-slate hover:text-ink transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {viewMode === "daily" && (
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={saving || dailyCounts.unmarked === 0}
              className="btn btn-sm btn-primary whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Unmarked as Present</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats in Daily Mode */}
      {viewMode === "daily" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCard
            label="Total Drivers"
            value={dailyCounts.total}
            icon={Users}
            onClick={() => setStatusFilter("all")}
          />
          <StatCard
            label="Present (P)"
            value={dailyCounts.present}
            variant="teal"
            icon={CheckCircle2}
            onClick={() => setStatusFilter("present")}
          />
          <StatCard
            label="Absent (A)"
            value={dailyCounts.absent}
            variant="bad"
            icon={XCircle}
            onClick={() => setStatusFilter("absent")}
          />
          <StatCard
            label="On Leave (L)"
            value={dailyCounts.leave}
            variant="warn"
            icon={Clock}
            onClick={() => setStatusFilter("leave")}
          />
          <StatCard
            label="Unmarked"
            value={dailyCounts.unmarked}
            variant="default"
            icon={UserCheck}
            onClick={() => setStatusFilter("unmarked")}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search driver name, mobile, vehicle..."
          className="w-full sm:w-80"
        />

        {viewMode === "daily" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterChip
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              count={dailyCounts.total}
            >
              All
            </FilterChip>
            <FilterChip
              active={statusFilter === "present"}
              onClick={() => setStatusFilter("present")}
              count={dailyCounts.present}
            >
              Present
            </FilterChip>
            <FilterChip
              active={statusFilter === "absent"}
              onClick={() => setStatusFilter("absent")}
              count={dailyCounts.absent}
            >
              Absent
            </FilterChip>
            <FilterChip
              active={statusFilter === "leave"}
              onClick={() => setStatusFilter("leave")}
              count={dailyCounts.leave}
            >
              Leave
            </FilterChip>
            <FilterChip
              active={statusFilter === "unmarked"}
              onClick={() => setStatusFilter("unmarked")}
              count={dailyCounts.unmarked}
            >
              Unmarked
            </FilterChip>
          </div>
        )}
      </div>

      {/* DAILY ROSTER VIEW */}
      {viewMode === "daily" && (
        <div className="panel overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              <div className="h-10 bg-paper-subtle rounded-md" />
              <div className="h-10 bg-paper-subtle rounded-md" />
              <div className="h-10 bg-paper-subtle rounded-md" />
              <div className="h-10 bg-paper-subtle rounded-md" />
            </div>
          ) : filteredDaily.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No driver records found"
              description="No driver matches your search query or filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Assigned Vehicle</th>
                    <th>Mobile</th>
                    <th className="w-32">Current Status</th>
                    <th className="w-56 text-right">Attendance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDaily.map((row) => {
                    const isP = row.status === "PRESENT";
                    const isA = row.status === "ABSENT";
                    const isL = row.status === "LEAVE";
                    const isUnmarked = !row.status || row.status === "UNMARKED";

                    return (
                      <tr key={row.driverId} className="hover:bg-paper-subtle/50 transition-colors">
                        <td className="font-semibold text-ink">
                          {row.name}
                        </td>
                        <td>
                          {row.assignedVehicle ? (
                            <span className="font-mono text-[12.5px] font-semibold text-ink bg-paper-subtle px-2 py-0.5 rounded border border-line">
                              {row.assignedVehicle.vehicleNo}
                            </span>
                          ) : (
                            <span className="text-slate-soft italic text-[12px]">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="font-mono text-[12.5px] text-slate">
                          {row.mobile || "—"}
                        </td>
                        <td>
                          {isP ? (
                            <Badge variant="ok">Present (P)</Badge>
                          ) : isA ? (
                            <Badge variant="bad">Absent (A)</Badge>
                          ) : isL ? (
                            <Badge variant="warn">On Leave (L)</Badge>
                          ) : (
                            <span className="text-[12px] text-slate-soft font-medium">
                              Unmarked
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1.5 bg-paper-subtle p-1 rounded-lg border border-line">
                            <button
                              type="button"
                              onClick={() => handleMarkDaily(row.driverId, "PRESENT")}
                              title="Mark Present"
                              className={`px-3 py-1 rounded text-[12px] font-bold transition-all ${
                                isP
                                  ? "bg-teal text-white shadow-sm font-extrabold"
                                  : "text-slate hover:text-teal hover:bg-teal-soft/40"
                              }`}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkDaily(row.driverId, "ABSENT")}
                              title="Mark Absent"
                              className={`px-3 py-1 rounded text-[12px] font-bold transition-all ${
                                isA
                                  ? "bg-rust text-white shadow-sm font-extrabold"
                                  : "text-slate hover:text-rust hover:bg-rust-soft/40"
                              }`}
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkDaily(row.driverId, "LEAVE")}
                              title="Mark Leave"
                              className={`px-3 py-1 rounded text-[12px] font-bold transition-all ${
                                isL
                                  ? "bg-amber text-white shadow-sm font-extrabold"
                                  : "text-slate hover:text-amber hover:bg-amber-soft/40"
                              }`}
                            >
                              L
                            </button>
                            {!isUnmarked && (
                              <button
                                type="button"
                                onClick={() => handleMarkDaily(row.driverId, "UNMARKED")}
                                title="Clear Attendance"
                                className="px-2 py-1 rounded text-[11px] text-slate-soft hover:text-ink hover:bg-paper-muted"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MONTHLY SHEET MATRIX VIEW */}
      {viewMode === "monthly" && (
        <div className="panel overflow-hidden">
          <div className="p-4 border-b border-line bg-paper-subtle flex items-center justify-between flex-wrap gap-2 text-[12.5px] text-slate">
            <span>
              Click any calendar cell to toggle:{" "}
              <strong className="text-teal">Present (P)</strong> →{" "}
              <strong className="text-rust">Absent (A)</strong> →{" "}
              <strong className="text-amber">Leave (L)</strong> → Clear
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-teal inline-block" /> P: Present
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rust inline-block" /> A: Absent
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber inline-block" /> L: Leave
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              <div className="h-10 bg-paper-subtle rounded-md" />
              <div className="h-10 bg-paper-subtle rounded-md" />
              <div className="h-10 bg-paper-subtle rounded-md" />
            </div>
          ) : filteredMonthly.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No driver records found"
              description="No drivers found to display for the monthly sheet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-custom border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-paper-raised z-10 w-48 shadow-sm">
                      Driver Name
                    </th>
                    {Array.from({ length: curMonthDays }, (_, i) => i + 1).map((day) => {
                      const dayStr = String(day).padStart(2, "0");
                      const fullDate = `${selectedMonth}-${dayStr}`;
                      const isToday = fullDate === todayDateStr;

                      return (
                        <th
                          key={day}
                          className={`w-9 text-center p-1 text-[11px] font-mono ${
                            isToday ? "bg-teal-soft/40 text-teal font-bold" : ""
                          }`}
                        >
                          {day}
                        </th>
                      );
                    })}
                    <th className="text-center w-12 text-teal font-bold">P</th>
                    <th className="text-center w-12 text-rust font-bold">A</th>
                    <th className="text-center w-12 text-amber font-bold">L</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMonthly.map((d) => {
                    const sum = d.summary || { present: 0, absent: 0, leave: 0 };

                    return (
                      <tr key={d.driverId} className="hover:bg-paper-subtle/40">
                        <td className="sticky left-0 bg-paper-raised z-10 font-medium text-ink truncate max-w-[180px] shadow-sm">
                          <div>{d.name}</div>
                          {d.assignedVehicle && (
                            <div className="text-[11px] font-mono text-slate-soft truncate">
                              {d.assignedVehicle.vehicleNo}
                            </div>
                          )}
                        </td>

                        {Array.from({ length: curMonthDays }, (_, i) => i + 1).map((day) => {
                          const val = d.days?.[day]?.status;
                          const cellStyle =
                            val === "PRESENT"
                              ? "bg-teal text-white font-bold"
                              : val === "ABSENT"
                              ? "bg-rust text-white font-bold"
                              : val === "LEAVE"
                              ? "bg-amber text-white font-bold"
                              : "text-slate-soft hover:bg-paper-muted";

                          const dayStr = String(day).padStart(2, "0");
                          const fullDate = `${selectedMonth}-${dayStr}`;
                          const isToday = fullDate === todayDateStr;

                          return (
                            <td key={day} className={`p-0.5 text-center ${isToday ? "border-x border-teal/40" : ""}`}>
                              <button
                                type="button"
                                onClick={() => handleCycleMonthlyCell(d.driverId, day)}
                                title={`Day ${day}: ${val || "Unmarked"}`}
                                className={`w-7 h-7 rounded text-[11px] font-mono transition-all mx-auto flex items-center justify-center ${cellStyle}`}
                              >
                                {val === "PRESENT" ? "P" : val === "ABSENT" ? "A" : val === "LEAVE" ? "L" : "·"}
                              </button>
                            </td>
                          );
                        })}

                        <td className="text-center font-mono font-bold text-teal text-[12.5px] bg-teal-soft/10">
                          {sum.present}
                        </td>
                        <td className="text-center font-mono font-bold text-rust text-[12.5px] bg-rust-soft/10">
                          {sum.absent}
                        </td>
                        <td className="text-center font-mono font-bold text-amber text-[12.5px] bg-amber-soft/10">
                          {sum.leave}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
