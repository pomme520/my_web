const items = [
  ['01', '電腦故障檢測', '檢查電源、記憶體、硬碟與作業系統問題，協助確認故障原因。'],
  ['02', 'Windows 重灌', '協助重灌系統、安裝驅動程式與完成基本工作環境設定。'],
  ['03', '病毒與惡意程式處理', '清理惡意軟體、異常廣告程式並提供基本安全建議。'],
  ['04', 'SSD／記憶體升級', '依設備規格與使用需求提供硬體升級建議。'],
  ['05', '網路與周邊設定', '處理網路、印表機及其他辦公周邊設備的連線問題。'],
  ['06', '資料備份與轉移', '協助重要工作檔案備份、轉移及設備更換前的資料整理。']
];

export default function Services() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
      <div className="border-l-4 border-blue-700 pl-5">
        <p className="text-sm font-bold tracking-widest text-blue-700">SERVICE INFORMATION</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">電腦報修服務說明</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">請依設備狀況選擇或描述問題。服務內容目前為測試版示範，實際處理方式以資訊人員判斷為準。</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(([number, name, description]) => (
          <div key={number} className="border border-slate-200 bg-white p-6 shadow-sm">
            <span className="font-black text-blue-700">{number}</span>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{name}</h2>
            <p className="mt-3 leading-7 text-slate-600">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 border border-blue-100 bg-blue-50 p-6 text-sm leading-7 text-slate-700">
        <h2 className="font-bold text-blue-900">報修前提醒</h2>
        <ul className="mt-2 list-inside list-disc">
          <li>請盡可能提供完整的設備名稱、錯誤訊息與發生時間。</li>
          <li>重要資料請先自行備份，避免維修過程造成資料遺失。</li>
          <li>若設備涉及機密或敏感資料，請於問題描述中註明。</li>
        </ul>
      </div>
    </div>
  );
}
