// Chart Configuration
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('electricalChart').getContext('2d');

    // Helper to generate dense data (e.g., for 60 seconds)
    function generateDenseData(points, min, max, initialValue) {
        const data = [];
        let val = initialValue || (min + max) / 2;
        for (let i = 0; i < points; i++) {
            // Random walk
            val += (Math.random() - 0.5) * (max - min) * 0.1;
            // Add Micro-noise (Jitter) for realism
            val += (Math.random() - 0.5) * (max - min) * 0.05;

            // Clamp
            val = Math.max(min, Math.min(max, val));
            data.push(parseFloat(val.toFixed(2)));
        }
        return data;
    }

    // Generate labels for Seconds (0s-59s), Minutes (0m-59m), Hours (0h-24h)
    const denseLabels = Array.from({ length: 60 }, (_, i) => i + 's');
    const denseMinutesLabels = Array.from({ length: 60 }, (_, i) => i + 'm');
    const denseHoursLabels = Array.from({ length: 25 }, (_, i) => i + 'h');

    // Helper to create standard single-line data structure
    function createModeData(label, color, bgColor, unit, min, max, valSec, valMin, valHour) {
        return {
            label, color, bgColor, unit, min, max,
            ranges: {
                seconds: { labels: denseLabels, data: generateDenseData(60, valSec.min, valSec.max, valSec.init) },
                minutes: { labels: denseMinutesLabels, data: generateDenseData(60, valMin.min, valMin.max, valMin.init) },
                hours: { labels: denseHoursLabels, data: generateDenseData(25, valHour.min, valHour.max, valHour.init) }
            }
        };
    }

    // Data for different modes and time ranges
    const chartData = {
        power: createModeData('Power', '#FF6B9C', 'rgba(255, 107, 156, 0.1)', 'W', 0, 400,
            { min: 240, max: 290, init: 264 }, // Widened range for more noise (50 * 0.05 = 2.5W jitter + random walk)
            { min: 255, max: 275, init: 260 },
            { min: 240, max: 290, init: 265 }
        ),
        voltage: createModeData('Voltage', '#D56BFF', 'rgba(213, 107, 255, 0.1)', 'V', 20, 24,
            { min: 21.5, max: 22.5, init: 22.0 },
            { min: 21.8, max: 22.4, init: 22.1 },
            { min: 21.0, max: 23.0, init: 21.5 }
        ),
        current: createModeData('Current', '#4ADE80', 'rgba(74, 222, 128, 0.1)', 'A', 10, 15,
            { min: 11, max: 13, init: 11.5 },
            { min: 11.5, max: 12.5, init: 12.0 },
            { min: 11.0, max: 13.0, init: 11.2 }
        ),
        torque: {
            type: 'multi',
            unit: 'Nm',
            min: -0.5, max: 0.5,
            ranges: {
                seconds: {
                    labels: denseLabels,
                    datasets: [
                        { label: 'FL', data: generateDenseData(60, 0.1, 0.2, 0.13), color: '#FF6B9C' },
                        { label: 'FR', data: generateDenseData(60, 0.3, 0.4, 0.35), color: '#D56BFF' },
                        { label: 'RL', data: generateDenseData(60, -0.3, -0.2, -0.28), color: '#4ADE80' },
                        { label: 'RR', data: generateDenseData(60, 0.15, 0.25, 0.18), color: '#60A5FA' }
                    ]
                },
                minutes: {
                    labels: denseMinutesLabels,
                    datasets: [
                        { label: 'FL', data: generateDenseData(60, 0.12, 0.16, 0.14), color: '#FF6B9C' },
                        { label: 'FR', data: generateDenseData(60, 0.32, 0.38, 0.35), color: '#D56BFF' },
                        { label: 'RL', data: generateDenseData(60, -0.32, -0.25, -0.29), color: '#4ADE80' },
                        { label: 'RR', data: generateDenseData(60, 0.18, 0.23, 0.20), color: '#60A5FA' }
                    ]
                },
                hours: {
                    labels: denseHoursLabels,
                    datasets: [
                        { label: 'FL', data: generateDenseData(25, 0.1, 0.18, 0.15), color: '#FF6B9C' },
                        { label: 'FR', data: generateDenseData(25, 0.3, 0.4, 0.32), color: '#D56BFF' },
                        { label: 'RL', data: generateDenseData(25, -0.35, -0.22, -0.25), color: '#4ADE80' },
                        { label: 'RR', data: generateDenseData(25, 0.15, 0.25, 0.17), color: '#60A5FA' }
                    ]
                }
            }
        }
    };

    let currentMode = 'power';
    let currentTimeRange = 'seconds'; // Default to seconds



    function hexToRgba(hex, alpha) {
        // Simple hex to rgba converter
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
        }
        return hex;
    }

    // Gradient Helper
    function createGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, hexToRgba(color, 0.4)); // Start slightly transparent
        gradient.addColorStop(1, hexToRgba(color, 0.0)); // Fade to nothing
        return gradient;
    }



    // Initial Data
    const initialRangeData = chartData[currentMode].ranges[currentTimeRange];
    const initialDatasets = getDatasetForMode(currentMode, currentTimeRange);

    const electricalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: initialRangeData.labels,
            datasets: initialDatasets
        },
        options: {
            animation: false, // PERFORMANCE: Disable animation for real-time data
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest', // Snap to closest point
                axis: 'x', // Lock to X axis
                intersect: false // Allow picking up point without direct touch (needed for line feel)
            },
            elements: {
                point: {
                    radius: 0 // Remove points for performance
                },
                line: {
                    tension: 0.4 // Scale curve
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    usePointStyle: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1E293B',
                    bodyColor: '#475569',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 4,
                    cornerRadius: 8,
                    titleFont: { family: 'Inter', size: 13, weight: '600' },
                    bodyFont: { family: 'Inter', size: 12 },
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' ' + (chartData[currentMode].unit || '');
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { family: 'Inter', size: 11 },
                        color: '#64748B'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: chartData[currentMode].min,
                    max: chartData[currentMode].max,
                    grid: {
                        color: '#F1F5F9',
                        borderDash: [5, 5]
                    },
                    ticks: {
                        stepSize: (chartData[currentMode].max - chartData[currentMode].min) / 4,
                        callback: function (value) {
                            return value + ' ' + (chartData[currentMode].unit || chartData[currentMode].datasets[0].unit); // Fixed unit access
                        },
                        font: { size: 10, family: 'Inter' },
                        color: '#94A3B8'
                    },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 10, family: 'Inter' },
                        color: '#94A3B8',
                        maxTicksLimit: 7,
                        autoSkip: true
                    },
                    border: { display: false }
                }
            }
        }
    });

    function updateChart() {
        const modeData = chartData[currentMode];
        const rangeData = modeData.ranges[currentTimeRange];

        electricalChart.data.labels = rangeData.labels;
        electricalChart.data.datasets = getDatasetForMode(currentMode, currentTimeRange);

        // Update scales
        electricalChart.options.scales.y.min = modeData.min;
        electricalChart.options.scales.y.max = modeData.max;
        electricalChart.options.scales.y.ticks.stepSize = (modeData.max - modeData.min) / 4;
        electricalChart.options.scales.y.ticks.callback = function (value) {
            return value + ' ' + modeData.unit;
        };

        electricalChart.update();
    }

    // Helper to create vertical fade gradient
    function createGradient(ctx, hexColor) {
        // Convert hex to rgb
        let r = 0, g = 0, b = 0;
        if (hexColor.length === 4) {
            r = parseInt(hexColor[1] + hexColor[1], 16);
            g = parseInt(hexColor[2] + hexColor[2], 16);
            b = parseInt(hexColor[3] + hexColor[3], 16);
        } else if (hexColor.length === 7) {
            r = parseInt(hexColor.substr(1, 2), 16);
            g = parseInt(hexColor.substr(3, 2), 16);
            b = parseInt(hexColor.substr(5, 2), 16);
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 300); // Adjust height roughly
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
        return gradient;
    }

    // Update getDatasetForMode to use gradients
    function getDatasetForMode(mode, range) {
        const modeData = chartData[mode];
        const rangeData = modeData.ranges[range];

        if (modeData.type === 'multi') {
            return rangeData.datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                borderColor: ds.color,
                backgroundColor: createGradient(ctx, ds.color), // Use Gradient!
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5, // Slightly larger on hover
                pointBackgroundColor: '#fff', // White center
                pointBorderColor: ds.color, // Colored border
                pointBorderWidth: 2,
                fill: true // Enable fill for multi line too? Maybe too messy. Let's keep false for multi.
            }));
        } else {
            return [{
                label: modeData.label,
                data: rangeData.data,
                borderColor: modeData.color,
                backgroundColor: createGradient(ctx, modeData.color), // Use Gradient!
                borderWidth: 3, // Slightly thicker line
                tension: 0.4, // Smoother curve
                pointBackgroundColor: '#fff',
                pointBorderColor: modeData.color,
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: true
            }];
        }
    }

    // Handle Graph Mode Selection (Segmented Control)
    const modeControls = document.getElementById('graphModeControls');
    if (modeControls) {
        modeControls.addEventListener('click', (e) => {
            if (e.target.classList.contains('control-btn')) {
                // Update specific active state
                const buttons = modeControls.querySelectorAll('.control-btn');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                currentMode = e.target.getAttribute('data-value');
                updateChart();
            }
        });
    }

    // Handle Time Range Selection (Segmented Control)
    const timeControls = document.getElementById('timeRangeControls');
    if (timeControls) {
        timeControls.addEventListener('click', (e) => {
            if (e.target.classList.contains('control-btn')) {
                // Update specific active state
                const buttons = timeControls.querySelectorAll('.control-btn');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                currentTimeRange = e.target.getAttribute('data-value');
                updateChart();
            }
        });
    }

    // Modal Helpers
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const btnCancel = document.getElementById('btnCancel');
    const btnConfirm = document.getElementById('btnConfirm');

    let pendingAction = null;

    function showConfirmation(title, message, action) {
        if (modal) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            pendingAction = action;
            modal.classList.add('show');
        }
    }

    function closeConfirmation() {
        if (modal) {
            modal.classList.remove('show');
            pendingAction = null;
        }
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', closeConfirmation);
    }

    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            if (pendingAction) {
                pendingAction();
            }
            closeConfirmation();
        });
    }

    // Button Logic
    const btnStart = document.getElementById('btnStart');
    const btnReset = document.getElementById('btnReset');
    let isRunning = false;

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (isRunning) {
                showConfirmation(
                    'Stop Program',
                    'Are you sure you want to stop the program?',
                    () => {
                        isRunning = false;
                        btnStart.textContent = 'Start Program';
                        btnStart.classList.remove('stopped');
                        console.log('Program Stopped');
                    }
                );
            } else {
                showConfirmation(
                    'Start Program',
                    'Are you sure you want to start the program?',
                    () => {
                        isRunning = true;
                        btnStart.textContent = 'Stop Program';
                        btnStart.classList.add('stopped');
                        console.log('Program Started');
                    }
                );
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            showConfirmation(
                'Reset Digital Twin',
                'Are you sure you want to reset the Digital Twin? This will clear all current data.',
                () => {
                    console.log('Digital Twin Reset');
                    // Add reset logic here if needed
                }
            );
        });
    }

    // Time Display Logic
    const currentTimeEl = document.getElementById('currentTime');
    const runningTimeEl = document.getElementById('runningTime');
    const startTimeComponent = Date.now();

    // Terminal Log Helper
    function logToTerminal(message) {
        const terminalWindow = document.querySelector('.terminal-logs');
        if (terminalWindow) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
            // Add new log line
            const logLine = document.createElement('div');
            logLine.className = 'log-line';
            logLine.innerHTML = `<span class="log-time">[${timeString}]</span> <span class="log-msg">${message}</span>`;
            terminalWindow.appendChild(logLine);
            // Auto scroll
            terminalWindow.scrollTop = terminalWindow.scrollHeight;
        }
    }

    // Initial Log
    const terminalWindow = document.querySelector('.terminal-logs');
    if (terminalWindow && terminalWindow.querySelector('.log-msg') && !terminalWindow.querySelector('.log-time')) {
        // Fix initial static log
        terminalWindow.innerHTML = ''; // Clear static
        logToTerminal('System Initialized');
        logToTerminal('Webots Connected');
    }

    function updateTime() {
        try {
            const now = new Date();

            // 1. Update Clock
            // ----------------------------------------------------------------
            if (currentTimeEl) {
                currentTimeEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
            }

            if (runningTimeEl) {
                const diff = now - startTimeComponent;
                const hours = Math.floor(diff / 3600000); // Total hours
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                runningTimeEl.textContent =
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }

            // 2. Update System Status (Terminal & Ping)
            // ----------------------------------------------------------------
            const sysUptimeEl = document.getElementById('sysUptime');
            if (sysUptimeEl && runningTimeEl) sysUptimeEl.textContent = runningTimeEl.textContent;

            const pingEl = document.querySelector('.status-ping');
            if (pingEl && Math.random() > 0.8) { // Update occasionally
                const ping = Math.floor(Math.random() * (40 - 15 + 1) + 15);
                pingEl.textContent = ping + ' ms';
                pingEl.style.color = ping < 50 ? '#4ADE80' : (ping < 100 ? '#FACC15' : '#EF4444');
            }

            // 3. Robot Simulation (State Machine)
            // ----------------------------------------------------------------
            const nowMs = Date.now();
            const cycleDuration = 4000;
            const cycleIndex = Math.floor(nowMs / cycleDuration) % 5;

            let drive = 0, strafe = 0, turn = 0;

            // Auto-Mode if not manually "Started" (or just always for demo)
            // Let's make it always run for the demo unless hidden
            switch (cycleIndex) {
                case 0: /* IDLE */ drive = 0; strafe = 0; turn = 0; break;
                case 1: /* FWD */  drive = 0.8; strafe = 0; turn = 0; break;
                case 2: /* BWD */  drive = -0.5; strafe = 0; turn = 0; break;
                case 3: /* LEFT */ drive = 0; strafe = -0.7; turn = 0; break;
                case 4: /* ROT */  turn = (Math.sin(nowMs / 500) * 0.8); break; // Sine wave rotation
            }

            // Add organic noise
            /* eslint-disable no-unused-vars */
            drive += (Math.random() - 0.5) * 0.05;
            strafe += (Math.random() - 0.5) * 0.05;
            turn += (Math.random() - 0.5) * 0.05;

            // 4. Electrical Simulation
            // ----------------------------------------------------------------
            // Voltage (LiPo Sag)
            const baseVoltage = 24.8;
            const voltageLoad = (Math.abs(drive) + Math.abs(strafe)) * 1.5; // Voltage drops when moving
            const simVoltage = baseVoltage - voltageLoad + ((Math.random() - 0.5) * 0.1);

            // Current (Load)
            const baseCurrent = 1.2; // Idle
            const currentLoad = (Math.abs(drive) + Math.abs(strafe) + Math.abs(turn)) * 20;
            const simCurrent = baseCurrent + currentLoad + ((Math.random() - 0.5) * 0.5);

            // Power
            const simPower = simVoltage * simCurrent;

            // 5. Update DOM Elements
            // ----------------------------------------------------------------
            const valVoltage = document.getElementById('valVoltage');
            const valCurrent = document.getElementById('valCurrent');
            const valPower = document.getElementById('valPower');
            const valCell = document.getElementById('valCell');

            if (valVoltage) valVoltage.textContent = simVoltage.toFixed(1) + ' V';
            if (valCell) valCell.textContent = (simVoltage / 6).toFixed(2) + ' V';
            if (valPower) valPower.textContent = Math.floor(simPower) + ' W';
            if (valCurrent) {
                valCurrent.textContent = simCurrent.toFixed(1) + ' A';
                valCurrent.style.color = simCurrent < 10 ? '#4ADE80' : (simCurrent < 20 ? '#FACC15' : '#EF4444');
            }

            // 6. Visualizer Updates (Wheels & Arrows)
            // ----------------------------------------------------------------
            // Kinematics
            let fl = drive + strafe + turn;
            let fr = drive - strafe - turn;
            let rl = drive - strafe + turn;
            let rr = drive + strafe - turn;

            // Normalize
            const maxM = Math.max(Math.abs(fl), Math.abs(fr), Math.abs(rl), Math.abs(rr), 1.0);
            fl /= maxM; fr /= maxM; rl /= maxM; rr /= maxM;

            // Update Wheels
            function setWheel(id, val) {
                const arr = document.getElementById('arrow' + id);
                const txt = document.getElementById('val' + id);
                const rpmTxt = document.getElementById('rpm' + id);

                if (arr && txt && rpmTxt) {
                    const abs = Math.abs(val);
                    const rpm = Math.floor(abs * 4000) + (abs > 0 ? Math.floor(Math.random() * 50) : 0);

                    // Arrow
                    const rot = val >= 0 ? 0 : 180;
                    const scale = abs < 0.05 ? 0.3 : (0.5 + abs * 0.5);
                    const color = val >= 0 ? '#4ADE80' : '#EF4444';

                    arr.style.transform = `rotate(${rot}deg) scale(${scale})`;
                    arr.style.color = color;

                    // Text
                    txt.textContent = (val >= 0 ? '+' : '') + val.toFixed(2) + ' Nm';
                    rpmTxt.textContent = rpm + ' RPM';

                    return rpm;
                }
                return 0;
            }

            const rpm1 = setWheel('FL', fl);
            const rpm2 = setWheel('FR', fr);
            const rpm3 = setWheel('RL', rl);
            const rpm4 = setWheel('RR', rr);

            const avgRPM = Math.floor((rpm1 + rpm2 + rpm3 + rpm4) / 4);
            const valRPM = document.getElementById('valRPM');
            if (valRPM) valRPM.textContent = avgRPM;

            // Resultant Arrow
            const resArrow = document.getElementById('resArrow');
            if (resArrow) {
                const mag = Math.sqrt(drive * drive + strafe * strafe);
                // Hide if idle AND no turn
                if (mag < 0.1 && Math.abs(turn) < 0.1) {
                    resArrow.style.opacity = '0';
                } else {
                    resArrow.style.opacity = '1';
                    // Check logic: Linear vs Rotate
                    const icon = resArrow.querySelector('i');
                    if (Math.abs(turn) > 0.5 && mag < 0.3) {
                        // Rotation Mode
                        resArrow.style.transform = 'scale(1.2)';
                        resArrow.style.color = '#D56BFF';
                        if (icon) icon.className = turn > 0 ? 'bx bx-rotate-left' : 'bx bx-rotate-right';
                    } else {
                        // Driver Mode
                        const angle = Math.atan2(drive, strafe) * (180 / Math.PI);
                        // atan2(y=drive, x=strafe). (1,0) -> 90. We want 0 deg transform to be UP (90).
                        // rotation = 90 - angle.
                        const rot = 90 - angle;
                        resArrow.style.transform = `rotate(${rot}deg) scale(${0.5 + mag * 0.5})`;
                        resArrow.style.color = '#1E293B';
                        if (icon) icon.className = 'bx bx-up-arrow-alt';
                    }
                }
            }

            // 7. Graph Real-time Update
            // ----------------------------------------------------------------
            // We only update if simulation is running, to save performance? 
            // No, user wants to see it ALIVE.
            if (electricalChart && electricalChart.data) {
                const ds = electricalChart.data.datasets;

                // Add new data point
                let newVal = 0;
                if (currentMode === 'power') newVal = simPower;
                else if (currentMode === 'voltage') newVal = simVoltage;
                else if (currentMode === 'current') newVal = simCurrent;

                // Only single line modes supported for simple demo animation
                if (ds.length === 1) {
                    const dataArr = ds[0].data;
                    dataArr.push(newVal);
                    dataArr.shift(); // Remove oldest

                    // Update textual labels (rolling 'Seconds') if needed?
                    // Actually labels are static '0s'...'59s' usually in this view.
                    // But strictly, we don't need to update labels if we are just scrolling content.
                    electricalChart.update('none'); // Efficient update
                }
            }

        } catch (err) {
            console.error("Simulation Error:", err);
            // Try to log to terminal so user sees it
            const terminal = document.querySelector('.terminal-logs');
            if (terminal) terminal.innerHTML += `<div style="color:red">ERROR: ${err.message}</div>`;
        }
    }

    // Start Loop
    setInterval(updateTime, 200); // 5Hz update for smoother animation
    updateTime(); // Initial call
});



