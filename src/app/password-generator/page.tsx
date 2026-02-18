"use client";

import { useCallback, useEffect, useState } from "react";
import { FormCheckbox } from "./components/form-checkbox";
import { FormInputText } from "./components/form-input-text";
import { FormLabel } from "./components/form-label";

export default function Page() {
  const [passwords, setPasswords] = useState<string[]>([]);
  const [length, setLength] = useState(12);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [useCustom, setUseCustom] = useState(false);
  const [customChars, setCustomChars] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const generatePasswords = useCallback(() => {
    let charset = "";
    if (useUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) charset += "0123456789";
    if (useSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    if (useCustom && customChars) charset += customChars;

    if (charset === "") {
      setPasswords([]);
      return;
    }

    charset = Array.from(new Set(charset)).join("");

    const newPasswords: string[] = [];
    for (let j = 0; j < 10; j++) {
      let newPassword = "";
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        newPassword += charset[randomIndex];
      }
      newPasswords.push(newPassword);
    }
    setPasswords(newPasswords);
  }, [
    length,
    useUppercase,
    useLowercase,
    useNumbers,
    useSymbols,
    useCustom,
    customChars,
  ]);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToastMessage("クリップボードにコピーしました");
  };

  return (
    <div className="flex items-center justify-center p-4 font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900  text-white  px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in-down transition-all">
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="w-full max-w-5xl p-8 bg-white  rounded-2xl shadow-xl border border-zinc-200 ">
        <h1 className="text-3xl font-bold text-center mb-8 text-zinc-900 ">
          Password Generator
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Controls */}
          <div className="space-y-6">
            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
              {/* Length */}
              <div className="flex justify-between mb-4 p-3 items-center">
                <FormLabel className="shrink-0">パスワードの長さ</FormLabel>
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-2 mx-6 bg-zinc-200  rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
                />
                <span className="text-lg font-bold text-blue-600  w-8 text-center">
                  {length}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100  transition-colors cursor-pointer"
                  onClick={() => setUseUppercase(!useUppercase)}
                >
                  <FormLabel className="cursor-pointer">
                    大文字(A-Z)を含める
                  </FormLabel>
                  <FormCheckbox
                    checked={useUppercase}
                    onChange={(e) => setUseUppercase(e.target.checked)}
                    className="cursor-pointer"
                  />
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100  transition-colors cursor-pointer"
                  onClick={() => setUseLowercase(!useLowercase)}
                >
                  <FormLabel className="cursor-pointer">
                    小文字(a-z)を含める
                  </FormLabel>
                  <FormCheckbox
                    checked={useLowercase}
                    onChange={(e) => setUseLowercase(e.target.checked)}
                    className="cursor-pointer"
                  />
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100  transition-colors cursor-pointer"
                  onClick={() => setUseNumbers(!useNumbers)}
                >
                  <FormLabel className="cursor-pointer">
                    数字(0-9)を含める
                  </FormLabel>
                  <FormCheckbox
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                    className="cursor-pointer"
                  />
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100  transition-colors cursor-pointer"
                  onClick={() => setUseSymbols(!useSymbols)}
                >
                  <FormLabel className="cursor-pointer">
                    記号(!@#$...)を含める
                  </FormLabel>
                  <FormCheckbox
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                    className="cursor-pointer"
                  />
                </button>
                {/* Custom Characters Input */}
                <div className="rounded-lg bg-zinc-100 mt-2 p-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                    onClick={() => setUseCustom(!useCustom)}
                  >
                    <FormLabel className="cursor-pointer">
                      カスタム文字を含める
                    </FormLabel>
                    <FormCheckbox
                      checked={useCustom}
                      onChange={(e) => setUseCustom(e.target.checked)}
                      className="cursor-pointer"
                    />
                  </button>
                  <FormInputText
                    value={customChars}
                    onChange={(e) => setCustomChars(e.target.value)}
                    placeholder="!@#$%^&*()_+~`|}{[]:;?><,./-="
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={generatePasswords}
              className="w-full py-4 text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all transform active:translate-y-0"
            >
              パスワードを生成する
            </button>
          </div>

          {/* Right Column: Results */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 h-full flex flex-col">
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-125">
              {passwords.map((pwd) => (
                <div
                  key={pwd}
                  className="group relative flex items-center bg-white  p-3 rounded-lg border border-zinc-200  hover:border-blue-400  transition-all"
                >
                  <span className="flex-1 font-mono text-lg text-zinc-800  break-all mr-10">
                    {pwd}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pwd)}
                    className="absolute right-2 p-2 text-zinc-400 hover:text-blue-500  transition-colors bg-white  rounded-md shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    title="コピー"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <title>コピー</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
