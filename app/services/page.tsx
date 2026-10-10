import Link from 'next/link';

const services = [
  ['01', '電腦故障檢測', '協助判斷無法開機、藍屏、系統異常及設備故障原因。'],
  ['02', '系統與軟體處理', '提供作業系統重灌、驅動程式安裝及基本環境設定。'],
  ['03', '硬體設備升級', '依設備規格提供 SSD、記憶體及周邊設備升級建議。']
];

const steps = [
  ['填寫報修單', '至「線上報修」填寫聯絡資料、設備類型、問題類型與問題描述。'],
  ['取得案件編號', '送出後系統會產生案件編號，請妥善保存。'],
  ['資訊人員處理', '資訊人員會檢視案件、指派維修人員並更新處理狀態。'],
  ['查詢進度', '隨時至「進度查詢」輸入案件編號，查看目前狀態。']
];

const statuses = [
  ['待確認', '已收到報修單，等待資訊人員確認。'],
  ['處理中', '案件已受理，維修人員正在處理。'],
  ['已完成', '維修完成，案件結案。'],
  ['已取消', '案件已取消，如仍有需求請重新報修。']
];

const faqs = [
  ['忘記案件編號怎麼辦？', '請洽資訊人員，並提供申請人姓名與報修時間協助查詢。'],
  ['可以上傳照片或附件嗎？', '目前尚未提供附件上傳，請在問題描述中詳述狀況（例如錯誤訊息內容）。'],
  ['查詢頁會顯示我的個人資料嗎？', '進度查詢僅顯示遮罩後的姓名、部門、問題描述與狀態，不會顯示電話與信箱。']
];

export default function ServicesPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold tracking-widest text-blue-700">SERVICE INFORMATION</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">服務說明</h1>
        <p className="mt-3 leading-7 text-slate-600">提供台東區營業處同仁電腦設備線上報修、案件追蹤與維修進度管理。</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {services.map(([number, title, description]) => (
            <article key={number} className="border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-3xl font-black text-blue-200">{number}</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-black text-slate-900">報修流程</h2>
        <ol className="mt-5 space-y-4">
          {steps.map(([title, description], index) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 font-black text-white">{index + 1}</span>
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-sm leading-6 text-slate-600">{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/booking" className="rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">填寫報修單</Link>
          <Link href="/tracking" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">查詢案件進度</Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-black text-slate-900">案件狀態說明</h2>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          {statuses.map(([status, description]) => (
            <div key={status} className="rounded-md bg-slate-50 p-4">
              <dt className="font-bold text-slate-900">{status}</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-black text-slate-900">常見問題</h2>
        <div className="mt-5 space-y-4">
          {faqs.map(([question, answer]) => (
            <div key={question}>
              <p className="font-bold text-slate-900">{question}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
