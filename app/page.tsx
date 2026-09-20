export default function HomePage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold text-blue-700">台東區營業處</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">電腦設備報修服務</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        歡迎使用台東區營業處電腦報修與進度查詢測試平台，請由左側選單選擇需要的服務。
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/booking" className="rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">線上報修</a>
        <a href="/tracking" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">進度查詢</a>
      </div>
    </section>
  );
}
