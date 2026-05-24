import type { Order } from "@/lib/pos-store";

export function Receipt({ order }: { order: Order }) {
  const d = new Date(order.createdAt);
  const dashed = "--------------------------------";
  return (
    <div id="printable-receipt" className="printable-receipt">
      <div className="r-header">ONE Cafe &amp; Restaurant</div>
      <div className="r-sub">📍 ڕانیە - ناو ڕانیە مۆڵ</div>
      <div className="r-divider">{dashed}</div>

      <div className="r-row">
        <span>ژمارەی داواکاری</span>
        <span>{order.number}</span>
      </div>
      <div className="r-row">
        <span>ڕێکەوت</span>
        <span>{d.toLocaleDateString("ku-IQ")}</span>
      </div>
      <div className="r-row">
        <span>کات</span>
        <span>{d.toLocaleTimeString("ku-IQ")}</span>
      </div>

      <div className="r-table">
        مێز: {order.table && order.table.trim() ? order.table : "سەفەری"}
      </div>

      <div className="r-divider">{dashed}</div>

      {order.lines.map((l) => (
        <div key={l.itemId} className="r-item">
          <div className="r-row">
            <span className="r-item-name">
              {l.qty} x {l.name}
            </span>
            <span className="r-item-price">{(l.price * l.qty).toLocaleString()}</span>
          </div>
        </div>
      ))}

      <div className="r-divider">{dashed}</div>

      <div className="r-row">
        <span>کۆی گشتی</span>
        <span>{order.subtotal.toLocaleString()}</span>
      </div>
      {order.tax > 0 && (
        <div className="r-row">
          <span>باج</span>
          <span>{order.tax.toLocaleString()}</span>
        </div>
      )}
      <div className="r-total">کۆی کۆتایی: {order.total.toLocaleString()} دینار</div>

      <div className="r-divider">{dashed}</div>
      <div className="r-footer">سوپاس بۆ سەردانەکەتان!</div>
    </div>
  );
}
