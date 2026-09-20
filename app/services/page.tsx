import Link from 'next/link';

const services = [
  ['01', '電腦故障檢測', '協助判斷無法開機、藍屏、系統異常及設備故障原因。'],
  ['02', '系統與軟體處理', '提供作業系統重灌、驅動程式安裝及基本環境設定。'],
  ['03', '硬體設備升級', '依設備規格提供 SSD、記憶體及周邊設備升級建議。']
];

export default function Home() {
  return (
    <>
      <section className="border-b border-blue-900 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-20">
          <div>
            <p className="mb-5 inline-block border-l-4 border-amber-300 pl-3 text-sm font-bold tracking-widest text-blue-100">資訊設備服務專區</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">台電台東區營業處<br />電腦設備線上報修</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">提供同仁快速提交電腦設備問題、取得報修案件編號，並查詢後續處理進度。</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/booking" className="rounded-md bg-amber-400 px-6 py-3 font-bold text-slate-900 transition hover:bg-amber-300">填寫報修單</Link>
              <Link href="/tracking" className="rounded-md border border-blue-200 px-6 py-3 font-bold text-white transition hover:bg-white/10">查詢案件進度</Link>
            </div>
          </div>

          <div className="border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <p className="border-b border-white/20 pb-4 text-sm font-bold text-blue-100">報修流程</p>
            <ol className="mt-5 space-y-5">
              {['填寫設備與問題資料', '取得案件編號', '資訊人員檢視與處理', '依案件編號查詢進度'].map((item, index) => (
                <li key={item} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-300 font-black text-blue-900">{index + 1}</span>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-700">SERVICE INFORMATION</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">報修服務項目</h2>
          </div>
          <Link href="/services" className="text-sm font-bold text-blue-700 hover:underline">查看完整服務說明 →</Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {services.map(([number, title, description]) => (
            <article key={number} className="border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
              <span className="text-3xl font-black text-blue-200">{number}</span>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div><p className="text-sm text-slate-500">報修方式</p><p className="mt-2 text-lg font-bold">線上填寫報修單</p></div>
            <div><p className="text-sm text-slate-500">案件查詢</p><p className="mt-2 text-lg font-bold">使用案件編號查詢</p></div>
            <div><p className="text-sm text-slate-500">系統狀態</p><p className="mt-2 text-lg font-bold text-emerald-700">測試版服務運作中</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
