import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Settings, X } from 'lucide-react';

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [autoStart, setAutoStart] = useState(false);
  const [autoStartAfterBreak, setAutoStartAfterBreak] = useState(false);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [continueTaskUntilLongBreak, setContinueTaskUntilLongBreak] = useState(false);
  const intervalRef = useRef(null);
  const wakeLockRef = useRef(null);
  const startTimeRef = useRef(null);
  const targetTimeRef = useRef(null);

const [isPro, setIsPro] = useState(() => {
  return localStorage.getItem("isPro") === "true";
});
const [showProModal, setShowProModal] = useState(false);

const requirePro = (action) => {
  if (isPro) return action();
  setShowProModal(true);
};

const unlockPro = () => {
  localStorage.setItem("isPro", "true");
  setIsPro(true);
  setShowProModal(false);
};

const resetPro = () => {
  localStorage.removeItem("isPro");
  setIsPro(false);
};

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            playNotification();
            
            if (mode === 'work') {
              setCompletedPomodoros(prev => prev + 1);
              setMode('break');
              const nextPomodoroCount = completedPomodoros + 1;
              if (nextPomodoroCount % longBreakInterval === 0) {
                setMinutes(15);
              } else {
                setMinutes(5);
              }
              setSeconds(0);
              setIsActive(autoStart);
            } else {
              setMode('work');
              setMinutes(25);
              setSeconds(0);
              const isLongBreak = completedPomodoros % longBreakInterval === 0;
              if (isLongBreak || !continueTaskUntilLongBreak) {
                setCurrentTask('');
                setTaskInput('');
              }
              // 短時間休憩後かつタスク継続中なら自動開始
              const shouldAutoStart = !isLongBreak && continueTaskUntilLongBreak && autoStartAfterBreak;
              setIsActive(shouldAutoStart);
            }
          } else {
            setMinutes(prev => prev - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(prev => prev - 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
        }, [isActive, minutes, seconds, mode, completedPomodoros, longBreakInterval, autoStart, autoStartAfterBreak, continueTaskUntilLongBreak]);

  const playNotification = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    if (!isActive && !currentTask && mode === 'work') {
      if (!taskInput.trim()) {
        return;
      }
    }
    if (!isActive && taskInput && mode === 'work' && !currentTask) {
      setCurrentTask(taskInput);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    targetTimeRef.current = null;
    startTimeRef.current = null;
    if (mode === 'work') {
      setMinutes(25);
      setCurrentTask('');
      setTaskInput('');
    } else {
      setMinutes(5);
    }
    setSeconds(0);
  };

  const switchMode = (newMode) => {
    setIsActive(false);
    targetTimeRef.current = null;
    startTimeRef.current = null;
    setMode(newMode);
    if (newMode === 'work') {
      setMinutes(25);
    } else {
      if (completedPomodoros % longBreakInterval === 0 && completedPomodoros > 0) {
        setMinutes(15);
      } else {
        setMinutes(5);
      }
    }
    setSeconds(0);
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = mode === 'work' 
    ? ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100
    : ((minutes === 15 ? 15 : 5) * 60 - (minutes * 60 + seconds)) / ((minutes === 15 ? 15 : 5) * 60) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md">
       {/* Header */}
<div className="px-4 py-5 sm:px-6 sm:py-6 border-b border-gray-100">
  <div className="flex items-center justify-between">
    {/* 左：タイトル */}
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">ポモドーロタイマー</h1>
      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">集中して作業</p>
    </div>

    {/* 右：Free/Proバッジ + 設定ボタン */}
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-lg ${
          isPro ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        }`}
      >
        {isPro ? "Pro" : "Free"}
      </span>

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2.5 sm:p-3 rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
      >
        <Settings size={22} className="text-gray-600" />
      </button>
    </div>
  </div>
</div>


        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-5 bg-gray-50 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">設定</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
              {!isPro && (
  <p className="text-xs text-gray-600 mb-3">
    🔒 の項目はPro（買い切り）で解放できます
  </p>
)}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
  長時間休憩の頻度
  {!isPro && <span className="ml-2 text-xs text-gray-500">🔒 Pro</span>}
</label>
                <div className="flex items-center gap-3">
                  <input
  type="range"
  min="2"
  max="8"
  value={longBreakInterval}
  onPointerDown={(e) => {
    if (!isPro) {
      e.preventDefault();
      setShowProModal(true);
    }
  }}
  onChange={(e) => requirePro(() => setLongBreakInterval(Number(e.target.value)))}
  className={`flex-1 ${!isPro ? "opacity-60" : ""}`}
  disabled={isActive}
/>

                  <div className="text-right min-w-[70px]">
                    <span className="text-xl sm:text-2xl font-bold text-red-600">{longBreakInterval}</span>
                    <span className="text-xs text-gray-600 ml-1">回</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {longBreakInterval}回完了後に15分休憩
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
  作業後に自動開始 {!isPro && <span className="ml-2 text-xs text-gray-500">🔒 Pro</span>}
</div>
                    <div className="text-xs text-gray-600 mt-0.5">作業完了後すぐ休憩</div>
                  </div>
                  <div
                    onClick={() => requirePro(() => setAutoStart(!autoStart))}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      autoStart ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out mt-1 ${
                        autoStart ? 'translate-x-6 ml-0.5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
  休憩後に自動開始 {!isPro && <span className="ml-2 text-xs text-gray-500">🔒 Pro</span>}
</div>
                    <div className="text-xs text-gray-600 mt-0.5">短時間休憩後すぐ作業</div>
                  </div>
                  <div
                    onClick={() => requirePro(() => setAutoStartAfterBreak(!autoStartAfterBreak))}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      autoStartAfterBreak ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out mt-1 ${
                        autoStartAfterBreak ? 'translate-x-6 ml-0.5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
  タスク継続 {!isPro && <span className="ml-2 text-xs text-gray-500">🔒 Pro</span>}
</div>

                    <div className="text-xs text-gray-600 mt-0.5">長時間休憩まで継続</div>
                  </div>
                  <div
                    onClick={() => requirePro(() => setContinueTaskUntilLongBreak(!continueTaskUntilLongBreak))}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      continueTaskUntilLongBreak ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out mt-1 ${
                        continueTaskUntilLongBreak ? 'translate-x-6 ml-0.5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </label>
              </div>
{import.meta.env.DEV && (
  <button
    onClick={resetPro}
    className="mt-2 text-xs text-gray-500 underline"
  >
    Proを解除（開発用）
  </button>
)}
            </div>
          )}

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              onClick={() => switchMode('work')}
              className={`py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all active:scale-95 ${
                mode === 'work'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Briefcase className="inline mr-1.5" size={16} />
              作業
            </button>
            <button
              onClick={() => switchMode('break')}
              className={`py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all active:scale-95 ${
                mode === 'break'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Coffee className="inline mr-1.5" size={16} />
              休憩
            </button>
          </div>

          {/* Task Input */}
          {mode === 'work' && (
            <div className="mb-5">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                現在のタスク
                {continueTaskUntilLongBreak && currentTask && (
                  <span className="ml-2 text-xs font-normal text-orange-600">
                    (継続中)
                  </span>
                )}
              </label>
              {!isActive && !currentTask ? (
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="何に取り組みますか？"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && taskInput.trim()) {
                      toggleTimer();
                    }
                  }}
                />
              ) : (
                <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm sm:text-base text-gray-800 font-medium">{currentTask || taskInput}</p>
                </div>
              )}
            </div>
          )}

          {/* Timer Display */}
          <div className="relative mb-5 py-4">
            <svg className="w-full h-48 sm:h-56" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="10"
              />
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke={mode === 'work' ? '#ef4444' : '#10b981'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 85}`}
                strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
                transform="rotate(-90 100 100)"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold text-gray-800 mb-1">
                  {formatTime(minutes, seconds)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide font-medium">
                  {mode === 'work' ? '作業時間' : '休憩時間'}
                </div>
                {isActive && 'wakeLock' in navigator && (
                  <div className="text-xs text-green-600 mt-2">
                    🔒 画面オン維持中
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-5 gap-2 mb-5">
            <button
              onClick={toggleTimer}
              className={`col-span-4 py-4 sm:py-5 rounded-xl font-bold text-sm sm:text-base text-white transition-all shadow-lg active:scale-95 ${
                isActive
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : mode === 'work'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="inline mr-1.5" size={18} />
                  停止
                </>
              ) : (
                <>
                  <Play className="inline mr-1.5" size={18} />
                  開始
                </>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="py-4 sm:py-5 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all active:scale-95 flex items-center justify-center"
            >
              <RotateCcw size={18} className="text-gray-700" />
            </button>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-gray-600 mb-0.5">完了</div>
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{completedPomodoros}</div>
              </div>
              {longBreakInterval > 0 && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">次の長時間休憩</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-700">
                    あと{longBreakInterval - (completedPomodoros % longBreakInterval)}回
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    {showProModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Proで解放 🔓</h3>
              <p className="text-sm text-gray-600 mt-1">
                自動開始や長時間休憩など、集中の“自動化”が使えます。
              </p>
            </div>
            <button
              onClick={() => setShowProModal(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>

         <div className="mt-4 space-y-2 text-sm text-gray-700">
  <div>✅ 長時間休憩で燃え尽きを防ぐ</div>
  <div>✅ 自動開始で「再開の摩擦」をゼロに</div>
  <div>✅ タスク継続で集中を途切れさせない</div>
</div>


          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowProModal(false)}
              className="py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold"
            >
              後で
            </button>
            <button
              onClick={unlockPro}
              className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              Proを購入（買い切り）
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
  <div className="text-sm font-semibold text-gray-800">買い切り：¥480（予定）</div>
  <div className="text-xs text-gray-600 mt-1">※ いまはテスト用の購入ボタンです</div>
</div>

          </p>
        </div>
      </div>
    )}
    </div>
  );
}