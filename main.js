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
        const now = new Date();
        // Use the outer variable properly (remove shadowing if any, but let's just use the outer const)
        // Accessing outer scope 'startTimeComponent' directly

        // Electrical Data Elements (Declared top-level to avoid ReferenceError/TDZ)
        const valVoltage = document.getElementById('valVoltage');
        const valCurrent = document.getElementById('valCurrent');
        const valPower = document.getElementById('valPower');
        const valRPM = document.getElementById('valRPM');

        // Update Clock and Date
        if (currentTimeEl) {
            currentTimeEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
        }

        if (runningTimeEl) {
            const diff = now - startTimeComponent;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            runningTimeEl.textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        // Simulate Latency Color Coding
        const pingEl = document.querySelector('.status-ping');
        if (pingEl) {
            // Randomize ping slightly for realism
            const ping = Math.floor(Math.random() * (40 - 15 + 1) + 15);
            pingEl.textContent = ping + ' ms';

            if (ping < 50) {
                pingEl.style.color = '#4ADE80'; // Green
            } else if (ping < 100) {
                pingEl.style.color = '#FACC15'; // Yellow
            } else {
                pingEl.style.color = '#EF4444'; // Red
            }
        }

        // Update System Uptime in Terminal
        const sysUptimeEl = document.getElementById('sysUptime');
        if (sysUptimeEl) {
            // Using same logic as running time
            const diff = now - startTimeComponent;
            const hours = Math.floor(diff / 3600000); // Total hours
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            sysUptimeEl.textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        // Simulate CPU, MEM, TEMP
        if (Math.random() > 0.5) { // Update less frequently perhaps? or every second is fine for "live" feel
            const cpuEl = document.getElementById('sysCpu');
            const memEl = document.getElementById('sysMem');
            const tempEl = document.getElementById('sysTemp');

            if (cpuEl) cpuEl.textContent = Math.floor(Math.random() * (30 - 5) + 5) + '%';
            if (memEl) memEl.textContent = Math.floor(Math.random() * (40 - 20) + 20) + '%';
            if (tempEl) tempEl.textContent = Math.floor(Math.random() * (55 - 35) + 35) + '°C';
        }

        // Omniwheel Simulation & Visualization
        const flArrow = document.getElementById('arrowFL');
        const frArrow = document.getElementById('arrowFR');
        const rlArrow = document.getElementById('arrowRL');
        const rrArrow = document.getElementById('arrowRR');
        const resArrow = document.getElementById('resArrow');

        // SIMULATION STATE MACHINE
        // To show variety, we cycle through different movement patterns.
        const nowMs = Date.now();
        const cycleDuration = 3000; // 3 seconds per state
        const cycleIndex = Math.floor(nowMs / cycleDuration) % 6; // 6 States

        let drive = 0, strafe = 0, turn = 0;

        switch (cycleIndex) {
            case 0: // IDLE
                drive = 0; strafe = 0; turn = 0;
                break;
            case 1: // FORWARD
                drive = 0.8; strafe = 0; turn = 0;
                break;
            case 2: // BACKWARD
                drive = -0.6; strafe = 0; turn = 0;
                break;
            case 3: // STRAFE LEFT
                drive = 0; strafe = -0.8; turn = 0;
                break;
            case 4: // STRAFE RIGHT
                drive = 0; strafe = 0.8; turn = 0;
                break;
            case 5: // ROTATE CW & CCW (Split time)
                if ((nowMs % 3000) < 1500) {
                    turn = 0.9; // CCW (Left)
                } else {
                    turn = -0.9; // CW (Right)
                }
                break;
        }

        // Add some noise
        drive += (Math.random() - 0.5) * 0.1;
        strafe += (Math.random() - 0.5) * 0.1;
        turn += (Math.random() - 0.5) * 0.1;

        if (flArrow && frArrow && rlArrow && rrArrow && resArrow) {
            // Mecanum Kinematics (Simplified)
            // FL = D + S + T
            // FR = D - S - T
            // RL = D - S + T
            // RR = D + S - T

            let fl = drive + strafe + turn;
            let fr = drive - strafe - turn;
            let rl = drive - strafe + turn;
            let rr = drive + strafe - turn;

            // Normalize to max 1.0 roughly for display
            const maxVal = Math.max(Math.abs(fl), Math.abs(fr), Math.abs(rl), Math.abs(rr), 1.0);
            fl /= maxVal; fr /= maxVal; rl /= maxVal; rr /= maxVal;

            // Helper to update specific wheel
            function updateWheel(arrowEl, valElId, rpmElId, val) {
                const valEl = document.getElementById(valElId);
                const rpmEl = document.getElementById(rpmElId);
                const absVal = Math.abs(val);

                // Calculate RPM (Simulated: Max 5000 RPM proportional to normalized value)
                // Add minor random noise for realism
                const wheelRpm = Math.floor(absVal * 5000) + (absVal > 0.1 ? Math.floor(Math.random() * 20) : 0);

                // Update Text
                if (valEl) valEl.textContent = (val >= 0 ? '+' : '') + val.toFixed(2) + ' Nm';
                if (rpmEl) rpmEl.textContent = wheelRpm + ' RPM';

                // Update Arrow
                const isZero = absVal < 0.05;
                // Rotation: 0 (Up) if positive, 180 (Down) if negative
                const rotation = val >= 0 ? 0 : 180;
                const color = val >= 0 ? '#4ADE80' : '#EF4444'; // Green / Red

                // Scale logic: 
                // If practically zero, scale down to minimum visible size
                const displayScale = isZero ? 0.3 : (0.5 + (absVal * 0.5));
                // const displayOpacity = isZero ? 0.2 : 1.0; // User requested not to dim wheels

                arrowEl.style.transform = `rotate(${rotation}deg) scale(${displayScale})`;
                arrowEl.style.color = color;
                arrowEl.style.opacity = '1.0'; // Always visible
                arrowEl.style.textShadow = isZero ? 'none' : `0 0 10px ${color}`;

                return wheelRpm; // Return for average calc
            }

            const rpmFLVal = updateWheel(flArrow, 'valFL', 'rpmFL', fl);
            const rpmFRVal = updateWheel(frArrow, 'valFR', 'rpmFR', fr);
            const rpmRLVal = updateWheel(rlArrow, 'valRL', 'rpmRL', rl);
            const rpmRRVal = updateWheel(rrArrow, 'valRR', 'rpmRR', rr);

            // Note: Global RPM is updated below in Electrical section, we might want to sync them.
            // Let's store avg rpm here to use it later or just trust the separate calculation?
            // User requested "Avg RPM" -> just number.
            const avgRpmCalc = Math.floor((rpmFLVal + rpmFRVal + rpmRLVal + rpmRRVal) / 4);
            if (valRPM) valRPM.textContent = avgRpmCalc; // Removed ' rpm' suffix

            // Update Resultant Arrow
            // Vector Sum of Drive and Strafe (ignoring turn for movement direction)
            // Atan2(y, x) -> y is forward (drive), x is strafe.
            // Screen coordinates: Up is 0 deg.
            // Angle in degrees
            let angle = 0;
            // Fix atan2(0,0) resulting in 0 -> 90deg (Right)
            if (Math.abs(drive) < 0.05 && Math.abs(strafe) < 0.05) {
                angle = 90; // So 90 - 90 = 0 (Up)
            } else {
                angle = Math.atan2(drive, strafe) * (180 / Math.PI);
            }

            // Atan2(y, x):
            // (1, 0) -> 90 deg (Up)
            // (0, 1) -> 0 deg (Right)
            // We want Up to be 0 deg CSS transform.
            // CSS 0 deg is North? Yes.
            // Math 90 deg is North.
            // So CSS = 90 - Math.
            const resRotation = 90 - angle;

            // Magnitude for scale (Linear movement only)
            const magnitude = Math.sqrt(drive * drive + strafe * strafe);
            const resScale = magnitude < 0.1 ? 0.5 : (0.5 + (Math.min(magnitude, 1.0) * 0.5));

            // HIDE when idle to prevent "Stuck" look
            // ISSUE FIX: Pure rotation has 0 magnitude, so it was hiding the arrow.
            // We must check if there is ANY movement (Linear OR Angular).
            const isMoving = magnitude > 0.1 || Math.abs(turn) > 0.1;
            const resOpacity = isMoving ? 1.0 : 0.0;

            // Rotation Indicator Logic
            // User Request: Replace central arrow with rotation icon if rotating

            const leftSide = (fl + rl);
            const rightSide = (fr + rr);
            const yawMoment = leftSide - rightSide;
            const turnThreshold = 0.5; // Tuning

            const resIcon = resArrow.querySelector('i');

            // Check if rotating Dominantly
            if (Math.abs(yawMoment) > turnThreshold && magnitude < 0.3) {
                // Rotating AND Linear movement is low (Dominant Turn)
                // Reset transform for rotation icon because we don't want to rotate the icon element itself based on angle
                resArrow.style.transform = `scale(1.2)`; // Just scale up slightly
                resArrow.style.color = '#D56BFF'; // Purple
                resArrow.style.opacity = '1.0'; // Always show if rotating

                if (yawMoment > 0) {
                    // CCW (Left) - Based on positive moment
                    if (resIcon) resIcon.className = 'bx bx-rotate-left';
                } else {
                    // CW (Right)
                    if (resIcon) resIcon.className = 'bx bx-rotate-right';
                }
            } else {
                // Translating (Moving Linear) or Idle
                if (resIcon) resIcon.className = 'bx bx-up-arrow-alt';

                // Restore Vector Logic
                resArrow.style.transform = `rotate(${resRotation}deg) scale(${resScale})`;
                resArrow.style.color = '#1E293B'; // Dark Slate for visibility
                resArrow.style.opacity = resOpacity.toString();
            }
            // Rotation Indicator Logic (for rotCCW/rotCW elements)
            const rotCCW = document.getElementById('rotCCW');
            const rotCW = document.getElementById('rotCW');

            if (rotCCW && rotCW) {
                // Determine turn direction from 'turn' input used in simulation
                // turn > 0 is one way, turn < 0 is other.
                // Assuming standard: positive is CCW (Left), negative is CW (Right) in standardized robotics coordinate?
                // Or user said:
                // Muter Kanan (CW): Roda Kiri Maju (+), Roda Kanan Mundur (-) -> Positive Turn?
                // Let's stick to the 'turn' variable we generated.
                // turn = (Math.random() - 0.5) * 1;

                // Let's deduce from 'fl' and 'fr' like requested "Differential Drive" logic
                // Left Side Avg = (fl + rl) / 2
                // Right Side Avg = (fr + rr) / 2
                // Yaw = Left - Right
                // If Yaw > threshold -> CW (Left side pushing more forward than right)
                // If Yaw < -threshold -> CCW (Right side pushing more forward than left)
                // Wait, if FL/RL positive (forward), FR/RR negative (backward), robot turns RIGHT (CW).
                // So (Left - Right) > 0 => CW.

                // yawMoment and turnThreshold are already calculated above.

                if (yawMoment > turnThreshold) {
                    // Turn Right (CW)
                    rotCW.classList.add('active-cw');
                    rotCCW.classList.remove('active-ccw');
                } else if (yawMoment < -turnThreshold) {
                    // Turn Left (CCW)
                    rotCCW.classList.add('active-ccw');
                    rotCW.classList.remove('active-cw');
                } else {
                    // Stable
                    rotCW.classList.remove('active-cw');
                    rotCCW.classList.remove('active-ccw');
                }
            }
        }




        // Battery Logic (6S LiPo)
        // 92% Battery -> ~24.8V
        const batteryPercent = 92;
        // Simple linear approx for demo: 0% = 19.0V, 100% = 25.2V
        // V = 19.0 + (Percent * (6.2 / 100))
        // Random fluctuation +/- 0.1V
        const voltage = 19.0 + (batteryPercent * 0.062) + ((Math.random() - 0.5) * 0.1);

        // Current Logic based on Movement State
        // IDLE: 0.5 - 2 A
        // MOVING: 10 - 25 A depending on drive/strafe
        let baseCurrent = 1.0;
        const totalDrive = Math.abs(drive) + Math.abs(strafe) + Math.abs(turn);
        if (totalDrive > 0.1) {
            baseCurrent = 5 + (totalDrive * 20); // Max ~25A
        }
        // Add noise
        const current = baseCurrent + ((Math.random() - 0.5) * 1.5);

        // Power = V * I
        const power = voltage * current;

        // RPM Logic (Handled in Omniwheel Visualizer loop for better accuracy)
        // Leaving placeholder or ensuring it doesn't overwrite if 0
        // const rpm = Math.floor(totalDrive * 5000) + Math.floor(Math.random() * 50);

        // Update DOM
        if (valVoltage) valVoltage.textContent = voltage.toFixed(1) + ' V';

        // Update Avg Cell Voltage (6S Config)
        const valCell = document.getElementById('valCell');
        if (valCell) {
            valCell.textContent = (voltage / 6).toFixed(2) + ' V';
        }
        if (valPower) valPower.textContent = Math.floor(power) + ' W';
        // if (valRPM) valRPM.textContent = rpm + ' rpm'; // Moved to Visualizer Logic

        if (valCurrent) {
            valCurrent.textContent = current.toFixed(1) + ' A';

            // Safety Color Coding
            valCurrent.style.fontWeight = '700';
            if (current < 10) {
                valCurrent.style.color = '#4ADE80'; // Green
            } else if (current < 20) {
                valCurrent.style.color = '#FACC15'; // Yellow
            } else {
                valCurrent.style.color = '#EF4444'; // Red (Danger)
            }
        }

    }

    setInterval(updateTime, 1000);
    updateTime(); // Initial call
});



