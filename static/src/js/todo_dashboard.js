/** @odoo-module **/

import { Component, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class TodoDashboard extends Component {
    static template = "todo_dashboard.Dashboard";

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");

        this.startDateRef = useRef("startDate");
        this.endDateRef = useRef("endDate");
        this.priorityRef = useRef("priority");
        this.completedRef = useRef("completed");

        this.charts = [];
        this.filtersText = "Showing: All Tasks";
    }

    getColor(index) {
        const colors = [
            '#4e79a7', '#f28e2b', '#e15759', '#76b7b2',
            '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
        ];
        return colors[index % colors.length];
    }

    destroyCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
    }

    async loadData(domain=[]) {
        const tasks = await this.orm.searchRead("todo.task", domain, [
            "name", "priority", "is_completed", "deadline"
        ]);

        const perPriority = {};
        const perCompleted = { "Completed": [], "Not Completed": [] };

        for (const task of tasks) {
            const priority = task.priority || "Undefined";
            perPriority[priority] = perPriority[priority] || [];
            perPriority[priority].push(task.id);

            const completed = task.is_completed ? "Completed" : "Not Completed";
            perCompleted[completed].push(task.id);
        }

        return {
            tasks,
            tasksPerPriority: Object.entries(perPriority).map(([key, ids]) => ({ key, value: ids.length, ids })),
            tasksPerCompleted: Object.entries(perCompleted).map(([key, ids]) => ({ key, value: ids.length, ids })),
        };
    }

    async renderCharts(data) {
        this.destroyCharts();

        const chartsData = {
            labels: data.tasksPerCompleted.map(d => d.key),
            datasets: [{
                label: "Tasks per Completed",
                data: data.tasksPerCompleted.map(d => d.value),
                backgroundColor: data.tasksPerCompleted.map((_, i) => this.getColor(i)),
            }]
        };

        const chartConfigs = [
            { id: "tasksBarChart", type: "bar" },
            { id: "tasksHorizontalBarChart", type: "bar", options: { indexAxis: 'y' } },
            { id: "tasksLineChart", type: "line" },
            { id: "tasksPieChart", type: "pie" },
            { id: "tasksDoughnutChart", type: "doughnut" },
            { id: "tasksPolarAreaChart", type: "polarArea" },
            { id: "tasksRadarChart", type: "radar" },
            { id: "tasksScatterChart", type: "scatter", customData: data.tasksPerCompleted.map((d, i) => ({ x: i, y: d.value })) },
            { id: "tasksBubbleChart", type: "bubble", customData: data.tasksPerCompleted.map((d, i) => ({ x: i, y: d.value, r: 10 })) },
        ];

        for (const cfg of chartConfigs) {
            const ctx = document.getElementById(cfg.id);
            if (!ctx) continue;

            const dataset = cfg.customData ? [{
                label: `Tasks (${cfg.type})`,
                data: cfg.customData,
                backgroundColor: data.tasksPerCompleted.map((_, i) => this.getColor(i)),
            }] : chartsData.datasets;

            const chart = new Chart(ctx, {
                type: cfg.type,
                data: {
                    labels: chartsData.labels,
                    datasets: dataset,
                },
                options: {
                    ...cfg.options,
                    onClick: async (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const label = chartsData.labels[index];
                            const ids = data.tasksPerCompleted.find(d => d.key === label)?.ids || [];
                            if (ids.length) {
                                await this.openTasks(ids, label);
                            }
                        }
                    }
                },
            });
            this.charts.push(chart);
        }
    }

    async openTasks(ids, label) {
        console.warn("No IDs found for", label , "ids", ids);
        await this.action.doAction({
            type: "ir.actions.act_window",
            name: `Tasks: ${label}`,
            res_model: "todo.task",
            domain: [['id', 'in', ids]],
            view_mode: "tree,form",
            views: [[false, 'list'], [false, 'form']],
            target: "current",
        });
    }

    async start(domain=[]) {
        const data = await this.loadData(domain);
        await this.renderCharts(data);
    }

    async mounted() {
        await this.onFilter(new Event("submit"));
    }

    async onFilter(ev) {
        ev.preventDefault();

        const startDate = this.startDateRef.el?.value;
        const endDate = this.endDateRef.el?.value;
        const priority = this.priorityRef.el?.value;
        const completed = this.completedRef.el?.value;

        const domain = [];
        let filters = [];

        if (startDate) {
            domain.push(["deadline", ">=", startDate]);
            filters.push(`Start ≥ ${startDate}`);
        }
        if (endDate) {
            domain.push(["deadline", "<=", endDate]);
            filters.push(`End ≤ ${endDate}`);
        }
        if (priority) {
            domain.push(["priority", "=", priority]);
            filters.push(`Priority = ${priority}`);
        }
        if (completed) {
            domain.push(["is_completed", "=", completed === "true"]);
            filters.push(`Status = ${completed === "true" ? "Completed" : "Not Completed"}`);
        }

        this.filtersText = filters.length ? `Showing: ${filters.join(", ")}` : "Showing: All Tasks";
        this.render();
        await this.start(domain);
    }
}

registry.category("actions").add("todo_dashboard.dashboard", TodoDashboard);
