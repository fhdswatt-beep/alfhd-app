import React from 'react';

/* مجسم ثلاثي الأبعاد خفيف مبني بالكامل بـCSS — بدون أي مكتبة إضافية */
export default function Hero3D() {
  const faces = Array.from({ length: 8 });
  return (
    <div className="fhd-gem-stage">
      <div className="fhd-gem-orbit" />
      <div className="fhd-gem">
        {faces.map((_, i) => (
          <span key={i} className="fhd-gem-face" style={{ '--i': i }} />
        ))}
        <span className="fhd-gem-core">الفهد</span>
      </div>
      <div className="fhd-gem-shadow" />
    </div>
  );
}
