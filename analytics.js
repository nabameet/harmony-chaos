let analyticsChart;

function updateAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (analyticsChart) {
        analyticsChart.destroy();
    }

    // Create new chart focusing on user interactions
    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Healing Actions', 'Trauma Actions'],
            datasets: [{
                data: [analyticsData.healActions, analyticsData.traumaActions],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',  // Healing color (cyan)
                    'rgba(255, 99, 132, 0.5)'   // Trauma color (red)
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Actions'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'User Interactions'
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const label = context.dataIndex === 0 ? 'Healing' : 'Trauma';
                            return `${label} Actions: ${value}`;
                        }
                    }
                }
            }
        }
    });

    // Add current system entropy state
    const chartTitle = document.querySelector('.modal-content h2');
    chartTitle.innerHTML = `User Interactions <br><small>Current System Entropy: ${(analyticsData.lastAverageEntropy * 100).toFixed(1)}%</small>`;
} 