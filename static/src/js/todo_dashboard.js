/** @odoo-module **/

import { Component, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class TodoDashboard extends Component {
    static template = "todo_dashboard.Dashboard";

    setup() {
        this.orm = useService("orm");

        this.startDateRef = useRef("startDate");
        this.endDateRef = useRef("endDate");
        this.priorityRef = useRef("priority");
        this.completedRef = useRef("completed");

        this.charts = [];
    }

    getColor(index) {
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
            '#6610f2', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
        ];
        return colors[index % colors.length];
    }

    destroyCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
    }

    async loadData(domain = []) {
        const tasks = await this.orm.searchRead("todo.task", domain, [
            "priority", "is_completed"
        ]);

        const perPriority = {};
        const perCompleted = { "Completed": 0, "Not Completed": 0 };

        for (const task of tasks) {
            const priority = task.priority || "Undefined";
            perPriority[priority] = (perPriority[priority] || 0) + 1;

            const completed = task.is_completed ? "Completed" : "Not Completed";
            perCompleted[completed] += 1;
        }

        return {
            tasksPerPriority: Object.entries(perPriority).map(([key, value]) => ({ key, value })),
            tasksPerCompleted: Object.entries(perCompleted).map(([key, value]) => ({ key, value })),
        };
    }

    async renderCharts(data) {
        this.destroyCharts();

        const labels = data.tasksPerCompleted.map(d => d.key);
        const backgroundColors = data.tasksPerCompleted.map((_, i) => this.getColor(i));
        const datasets = [{
            label: "Tasks per Completed",
            data: data.tasksPerCompleted.map(d => d.value),
            backgroundColor: backgroundColors,
        }];

        const chartConfigs = [
            { id: "tasksBarChart", type: "bar" },
            { id: "tasksHorizontalBarChart", type: "bar", options: { indexAxis: 'y' } },
            { id: "tasksLineChart", type: "line" },
            { id: "tasksPieChart", type: "pie" },
            { id: "tasksDoughnutChart", type: "doughnut" },
            { id: "tasksPolarAreaChart", type: "polarArea" },
            { id: "tasksRadarChart", type: "radar" },
            {
                id: "tasksScatterChart", type: "scatter", customData:
                    data.tasksPerCompleted.map((d, i) => ({ x: i, y: d.value }))
            },
            {
                id: "tasksBubbleChart", type: "bubble", customData:
                    data.tasksPerCompleted.map((d, i) => ({ x: i, y: d.value, r: 10 }))
            },
        ];

        for (const cfg of chartConfigs) {
            const ctx = document.getElementById(cfg.id);
            if (!ctx) continue;

            const ds = cfg.customData
                ? [{
                    label: `Tasks (${cfg.type})`,
                    data: cfg.customData,
                    backgroundColor: backgroundColors,
                }]
                : datasets;

            const chart = new Chart(ctx, {
                type: cfg.type,
                data: { labels, datasets: ds },
                options: cfg.options || {},
            });
            this.charts.push(chart);
        }
    }

    async start(domain = []) {
        const data = await this.loadData(domain);
        await this.renderCharts(data);
    }

    async mounted() {
        await this.onFilter(new Event("submit"));
    }

    async unmounted() {
        this.destroyCharts();
    }

    async onFilter(ev) {
        ev.preventDefault?.();

        const startDate = this.startDateRef.el?.value;
        const endDate = this.endDateRef.el?.value;
        const priority = this.priorityRef.el?.value;
        const completed = this.completedRef.el?.value;

        const domain = [];

        if (startDate) {
            domain.push(["deadline", ">=", startDate]);
        }
        if (endDate) {
            domain.push(["deadline", "<=", endDate]);
        }
        if (priority) {
            domain.push(["priority", "=", priority]);
        }
        if (completed) {
            domain.push(["is_completed", "=", completed === "true"]);
        }

        await this.start(domain);
    }
}

registry.category("actions").add("todo_dashboard.dashboard", TodoDashboard);
