# -*- coding: utf-8 -*-
{
    'name': "Todo Dashboard",
    'version': '1.0.0',
    'category': 'Productivity',
    'summary': """Dynamic Dashboard for Todo Tasks""",
    'description': """Dashboard with charts showing Todo Tasks statistics.""",
    'author': 'OdooX',
    'license': "LGPL-3",
    'depends': ['web', 'todo_task'],
    'data': [
        'views/todo_dashboard_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js',
            'todo_dashboard/static/src/scss/dashboard.scss',
            'todo_dashboard/static/src/js/todo_dashboard.js',
            'todo_dashboard/static/src/xml/todo_dashboard.xml',
        ],
    },
    'installable': True,
    'application': True,
}
