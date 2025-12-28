// Chart Configuration
import Chart from 'chart.js/auto';

// Type Definitions
interface TimeRangeData {
    labels: string[];
    data: number[];
}

interface MultiLineDataset {
    label: string;
    data: number[];
    color: string;
}

interface MultiTimeRangeData {
    labels: string[];
    datasets: MultiLineDataset[];
}

interface SingleModeData {
    type?: string;
    label: string;
    color: string;
    bgColor: string;
    unit: string;
    min: number;
    max: number;
    ranges: {
        seconds: TimeRangeData;
        minutes: TimeRangeData;
        hours: TimeRangeData;
    };
}

interface MultiModeData {
    type: 'multi';
    unit: string;
    min: number;
    max: number;
    ranges: {
        seconds: MultiTimeRangeData;
        minutes: MultiTimeRangeData;
        hours: MultiTimeRangeData;
    };
}



interface ChartDataConfig {
    power: SingleModeData;
    voltage: SingleModeData;
    current: SingleModeData;
    torque: MultiModeData;
}

interface DOMElements {
    clock: HTMLElement | null;
    running: HTMLElement | null;
    uptime: HTMLElement | null;
    ping: HTMLElement | null;
    valVoltage: HTMLElement | null;
    valCurrent: HTMLElement | null;
    valPower: HTMLElement | null;
    valCell: HTMLElement | null;
    valRPM: HTMLElement | null;
    resArrow: HTMLElement | null;
    resIcon: HTMLElement | null;
    wheels: {
        FL: WheelElements;
        FR: WheelElements;
        RL: WheelElements;
        RR: WheelElements;
    };
}

interface WheelElements {
    arrow: HTMLElement | null;
    val: HTMLElement | null;
    rpm: HTMLElement | null;
}

interface DataBuffer {
    power: number[];
    voltage: number[];
    current: number[];
}

interface ValueRange {
    min: number;
    max: number;
    init: number;
}

document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('electricalChart') as HTMLCanvasElement | null;
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context');
        return;
    }

    // Helper to generate dense data (e.g., for 60 seconds)
    function generateDenseData(points: number, min: number, max: number, initialValue: number): number[] {
        const data: number[] = [];
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
    const denseLabels: string[] = Array.from({ length: 60 }, (_, i) => i + 's');
    const denseMinutesLabels: string[] = Array.from({ length: 60 }, (_, i) => i + 'm');
    const denseHoursLabels: string[] = Array.from({ length: 25 }, (_, i) => i + 'h');

    // Helper to create standard single-line data structure
    function createModeData(
        label: string,
        color: string,
        bgColor: string,
        unit: string,
        min: number,
        max: number,
        valSec: ValueRange,
        valMin: ValueRange,
        valHour: ValueRange
    ): SingleModeData {
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
    const chartData: ChartDataConfig = {
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

    let currentMode: keyof ChartDataConfig = 'power';
    let currentTimeRange: 'seconds' | 'minutes' | 'hours' = 'seconds'; // Default to seconds





    // Gradient Helper
    function createGradient(ctx: CanvasRenderingContext2D, hexColor: string): CanvasGradient | string {
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
    function getDatasetForMode(mode: keyof ChartDataConfig, range: 'seconds' | 'minutes' | 'hours'): any[] {
        const modeData = chartData[mode];
        const rangeData = modeData.ranges[range];

        if (modeData.type === 'multi') {
            const multiRangeData = rangeData as MultiTimeRangeData;
            return multiRangeData.datasets.map((ds: MultiLineDataset) => ({
                label: ds.label,
                data: ds.data,
                borderColor: ds.color,
                backgroundColor: createGradient(ctx!, ds.color), // Use Gradient!
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
            const singleModeData = modeData as SingleModeData;
            const singleRangeData = rangeData as TimeRangeData;
            return [{
                label: singleModeData.label,
                data: singleRangeData.data,
                borderColor: singleModeData.color,
                backgroundColor: createGradient(ctx!, singleModeData.color), // Use Gradient!
                borderWidth: 3, // Slightly thicker line
                tension: 0.4, // Smoother curve
                pointBackgroundColor: '#fff',
                pointBorderColor: singleModeData.color,
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: true
            }];
        }
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
                    titleFont: { family: 'Inter', size: 13, weight: 600 as any },
                    bodyFont: { family: 'Inter', size: 12 },
                    callbacks: {
                        label: function (context: any) {
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
                        color: '#F1F5F9'
                    },
                    ticks: {
                        stepSize: (chartData[currentMode].max - chartData[currentMode].min) / 4,
                        callback: function (value: any) {
                            return value + ' ' + chartData[currentMode].unit;
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

    function updateChart(): void {
        const modeData = chartData[currentMode];
        const rangeData = modeData.ranges[currentTimeRange];

        electricalChart.data.labels = rangeData.labels;
        electricalChart.data.datasets = getDatasetForMode(currentMode, currentTimeRange);

        // Update scales
        electricalChart.options.scales!.y!.min = modeData.min;
        electricalChart.options.scales!.y!.max = modeData.max;
        (electricalChart.options.scales!.y!.ticks as any).stepSize = (modeData.max - modeData.min) / 4;
        electricalChart.options.scales!.y!.ticks!.callback = function (value: any) {
            return value + ' ' + modeData.unit;
        };

        electricalChart.update();
    }

    // Handle Graph Mode Selection (Segmented Control)
    const modeControls = document.getElementById('graphModeControls');
    if (modeControls) {
        modeControls.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('control-btn')) {
                // Update specific active state
                const buttons = modeControls.querySelectorAll('.control-btn');
                buttons.forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');

                currentMode = target.getAttribute('data-value') as keyof ChartDataConfig;
                updateChart();
            }
        });
    }

    // Handle Time Range Selection (Segmented Control)
    const timeControls = document.getElementById('timeRangeControls');
    if (timeControls) {
        timeControls.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('control-btn')) {
                // Update specific active state
                const buttons = timeControls.querySelectorAll('.control-btn');
                buttons.forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');

                currentTimeRange = target.getAttribute('data-value') as 'seconds' | 'minutes' | 'hours';
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

    let pendingAction: (() => void) | null = null;

    function showConfirmation(title: string, message: string, action: () => void): void {
        if (modal && modalTitle && modalMessage) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            pendingAction = action;
            modal.classList.add('show');
        }
    }

    function closeConfirmation(): void {
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
    const startTimeComponent = Date.now();

    // Terminal Log Helper
    function logToTerminal(message: string): void {
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

    // Data Aggregation Buffers
    const secBuffer: DataBuffer = { power: [], voltage: [], current: [] };
    const minBuffer: DataBuffer = { power: [], voltage: [], current: [] };
    let lastSecondUpdate = 0;

    // OPTIMIZATION: Cache DOM Elements
    const dom: DOMElements = {
        clock: document.getElementById('currentTime'),
        running: document.getElementById('runningTime'),
        uptime: document.getElementById('sysUptime'),
        ping: document.querySelector('.status-ping'),
        valVoltage: document.getElementById('valVoltage'),
        valCurrent: document.getElementById('valCurrent'),
        valPower: document.getElementById('valPower'),
        valCell: document.getElementById('valCell'),
        valRPM: document.getElementById('valRPM'),
        resArrow: document.getElementById('resArrow'),
        resIcon: document.getElementById('resArrow') ? document.getElementById('resArrow')!.querySelector('i') : null,
        wheels: {
            FL: {
                arrow: document.getElementById('arrowFL'),
                val: document.getElementById('valFL'),
                rpm: document.getElementById('rpmFL')
            },
            FR: {
                arrow: document.getElementById('arrowFR'),
                val: document.getElementById('valFR'),
                rpm: document.getElementById('rpmFR')
            },
            RL: {
                arrow: document.getElementById('arrowRL'),
                val: document.getElementById('valRL'),
                rpm: document.getElementById('rpmRL')
            },
            RR: {
                arrow: document.getElementById('arrowRR'),
                val: document.getElementById('valRR'),
                rpm: document.getElementById('rpmRR')
            }
        }
    };

    function updateTime(): void {
        try {
            const now = new Date();

            // 1. Update Clock
            // ----------------------------------------------------------------
            if (dom.clock) {
                dom.clock.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
            }

            if (dom.running) {
                const diff = now.getTime() - startTimeComponent;
                const hours = Math.floor(diff / 3600000); // Total hours
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                dom.running.textContent =
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }

            // 2. Update System Status (Terminal & Ping)
            // ----------------------------------------------------------------
            if (dom.uptime && dom.running) dom.uptime.textContent = dom.running.textContent;

            if (dom.ping && Math.random() > 0.8) { // Update occasionally
                const ping = Math.floor(Math.random() * (40 - 15 + 1) + 15);
                dom.ping.textContent = ping + ' ms';
                (dom.ping as HTMLElement).style.color = ping < 50 ? '#4ADE80' : (ping < 100 ? '#FACC15' : '#EF4444');
            }

            // 3. Robot Simulation (State Machine)
            // ----------------------------------------------------------------
            const nowMs = Date.now();
            const cycleDuration = 4000;
            const cycleIndex = Math.floor(nowMs / cycleDuration) % 5;

            let drive = 0, strafe = 0, turn = 0;

            switch (cycleIndex) {
                case 0: /* IDLE */ drive = 0; strafe = 0; turn = 0; break;
                case 1: /* FWD */  drive = 0.8; strafe = 0; turn = 0; break;
                case 2: /* BWD */  drive = -0.5; strafe = 0; turn = 0; break;
                case 3: /* LEFT */ drive = 0; strafe = -0.7; turn = 0; break;
                case 4: /* ROT */  turn = (Math.sin(nowMs / 500) * 0.8); break; // Sine wave rotation
            }

            // Add organic noise
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
            if (dom.valVoltage) dom.valVoltage.textContent = simVoltage.toFixed(1) + ' V';
            if (dom.valCell) dom.valCell.textContent = (simVoltage / 6).toFixed(2) + ' V';
            if (dom.valPower) dom.valPower.textContent = Math.floor(simPower) + ' W';
            if (dom.valCurrent) {
                dom.valCurrent.textContent = simCurrent.toFixed(1) + ' A';
                (dom.valCurrent as HTMLElement).style.color = simCurrent < 10 ? '#4ADE80' : (simCurrent < 20 ? '#FACC15' : '#EF4444');
            }

            // 6. Visualizer Updates (Wheels & Inverse Kinematics)
            // ----------------------------------------------------------------
            // Parameters (from cek_tombol.py)
            const L = 0.208;  // Wheel base distance
            const r_wheel = 0.06; // Wheel radius
            const sin_a = 0.7071; // sin(45°)
            const cos_a = 0.7071; // cos(45°)

            // Input: drive (vy in Python), strafe (vx), turn (vtheta)
            const vx = strafe;
            const vy = drive;
            const vtheta = turn;

            // Inverse Kinematics from cek_tombol.py
            // FR (w1) - Front Right
            const w1_FR = (-cos_a * vx + sin_a * vy + L * vtheta) / r_wheel;
            // FL (w2) - Front Left  
            const w2_FL = (-cos_a * vx - sin_a * vy + L * vtheta) / r_wheel;
            // RL (w3) - Rear Left
            const w3_RL = (cos_a * vx - sin_a * vy + L * vtheta) / r_wheel;
            // RR (w4) - Rear Right
            const w4_RR = (cos_a * vx + sin_a * vy + L * vtheta) / r_wheel;

            // Normalize for display (convert to torque approximation)
            const maxVel = Math.max(Math.abs(w1_FR), Math.abs(w2_FL), Math.abs(w3_RL), Math.abs(w4_RR), 10.0);
            const fl = w2_FL / maxVel; // FL
            const fr = w1_FR / maxVel; // FR
            const rl = w3_RL / maxVel; // RL  
            const rr = w4_RR / maxVel; // RR

            // Update Wheels
            function setWheel(id: string, val: number): number {
                // Update RPM value (without unit - unit is in HTML)
                const rpmEl = document.getElementById('rpm' + id);
                // Update Torque value (keeping format)
                const valEl = document.getElementById('val' + id);
                // Update Progress Bar
                const progEl = document.getElementById('prog' + id);

                if (rpmEl && valEl) {
                    const abs = Math.abs(val);
                    const rpm = Math.floor(abs * 4000) + (abs > 0 ? Math.floor(Math.random() * 50) : 0);

                    // Update RPM text (just number)
                    rpmEl.textContent = String(rpm);

                    // Update Torque text
                    valEl.innerHTML = (val >= 0 ? '+' : '') + val.toFixed(2) + ' <span class="torque-unit">Nm</span>';

                    // Update Progress Bar (0-250 RPM range)
                    if (progEl) {
                        const percentage = Math.min((rpm / 250) * 100, 100);
                        (progEl as HTMLElement).style.width = percentage + '%';
                    }

                    return rpm;
                }
                return 0;
            }

            const rpm1 = setWheel('FL', fl);
            const rpm2 = setWheel('FR', fr);
            const rpm3 = setWheel('RL', rl);
            const rpm4 = setWheel('RR', rr);

            const avgRPM = Math.floor((rpm1 + rpm2 + rpm3 + rpm4) / 4);
            if (dom.valRPM) dom.valRPM.textContent = String(avgRPM);

            // Overall Direction Indicator (Center of Visualizer)
            const overallDirection = document.getElementById('overallDirection');
            if (overallDirection) {
                const mag = Math.sqrt(drive * drive + strafe * strafe);
                const icon = overallDirection.querySelector('i');

                // Hide if idle
                if (mag < 0.1 && Math.abs(turn) < 0.1) {
                    overallDirection.classList.remove('active');
                } else {
                    overallDirection.classList.add('active');

                    // Check if rotating (turn dominant)
                    if (Math.abs(turn) > 0.5 && mag < 0.3) {
                        // Rotation Mode
                        overallDirection.classList.add('rotating');
                        if (icon) {
                            icon.className = turn > 0 ? 'bx bx-rotate-left' : 'bx bx-rotate-right';
                            (icon as HTMLElement).style.transform = '';
                        }
                    } else {
                        // Linear Movement Mode
                        overallDirection.classList.remove('rotating');
                        if (icon) {
                            // Calculate angle from drive (vy) and strafe (vx)
                            // atan2(y, x) where forward is drive, right is strafe
                            const angle = Math.atan2(drive, strafe) * (180 / Math.PI);
                            // Rotate arrow: 0° = UP, so we need to adjust
                            const rotation = 90 - angle;
                            icon.className = 'bx bx-up-arrow-alt';
                            (icon as HTMLElement).style.transform = `rotate(${rotation}deg)`;
                        }
                    }
                }
            }

            // 7. Graph Real-time Update (Cascading)
            // ----------------------------------------------------------------
            function updateModeData(mode: keyof ChartDataConfig, range: 'seconds' | 'minutes' | 'hours', value: number): void {
                if (!chartData[mode] || !chartData[mode].ranges[range]) return;

                // For multi-line charts (Torque), we'd need to handle datasets array. 
                // BUT current request implies simple single-line data mostly (Power/Voltage/Current).
                // Existing code only supported updating single-line graphs in real-time.
                // We will stick to that safe path.

                if (chartData[mode].type === 'multi') return; // Skip complex updates for now to avoid errors

                const rangeData = chartData[mode].ranges[range] as TimeRangeData;
                const dataArr = rangeData.data;
                dataArr.push(value);
                dataArr.shift(); // Keep fixed length
            }

            // Only update data if 1 second has passed
            // Use date.now() as lastSecondUpdate is initialized in global scope
            if (Date.now() - lastSecondUpdate >= 1000) {
                lastSecondUpdate = Date.now();

                // A. Update SECONDS (Every 1s)
                updateModeData('power', 'seconds', simPower);
                updateModeData('voltage', 'seconds', simVoltage);
                updateModeData('current', 'seconds', simCurrent);

                // Collect for Minutes Aggregation
                secBuffer.power.push(simPower);
                secBuffer.voltage.push(simVoltage);
                secBuffer.current.push(simCurrent);

                // B. Update MINUTES (Every 60s)
                if (secBuffer.power.length >= 60) {
                    const avgPower = secBuffer.power.reduce((a, b) => a + b, 0) / 60;
                    const avgVoltage = secBuffer.voltage.reduce((a, b) => a + b, 0) / 60;
                    const avgCurrent = secBuffer.current.reduce((a, b) => a + b, 0) / 60;

                    updateModeData('power', 'minutes', avgPower);
                    updateModeData('voltage', 'minutes', avgVoltage);
                    updateModeData('current', 'minutes', avgCurrent);

                    // Collect for Hours Aggregation
                    minBuffer.power.push(avgPower);
                    minBuffer.voltage.push(avgVoltage);
                    minBuffer.current.push(avgCurrent);

                    // Clear Seconds Buffer
                    secBuffer.power = [];
                    secBuffer.voltage = [];
                    secBuffer.current = [];
                }

                // C. Update HOURS (Every 60m)
                if (minBuffer.power.length >= 60) {
                    const avgPower = minBuffer.power.reduce((a, b) => a + b, 0) / 60;
                    const avgVoltage = minBuffer.voltage.reduce((a, b) => a + b, 0) / 60;
                    const avgCurrent = minBuffer.current.reduce((a, b) => a + b, 0) / 60;

                    updateModeData('power', 'hours', avgPower);
                    updateModeData('voltage', 'hours', avgVoltage);
                    updateModeData('current', 'hours', avgCurrent);

                    // Clear Minutes Buffer
                    minBuffer.power = [];
                    minBuffer.voltage = [];
                    minBuffer.current = [];
                }

                // D. Refresh Chart (Only if data changed)
                if (electricalChart) {
                    electricalChart.update('none');
                }
            }

            // D. Refresh Chart
            // Just call update() - Chart.js picks up the modified array reference
            if (electricalChart) {
                electricalChart.update('none');
            }

        } catch (err) {
            console.error("Simulation Error:", err);
        }
    }

    // Start Loop
    setInterval(updateTime, 200); // 5Hz update
    updateTime(); // Initial call
});
