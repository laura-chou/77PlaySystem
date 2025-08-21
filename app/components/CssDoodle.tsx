'use client';

import React, { useEffect, useRef } from 'react';

interface CssDoodleProps {
    code: string;
    className?: string;
    style?: React.CSSProperties;
}

export default function CssDoodle({ code, className, style }: CssDoodleProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
        containerRef.current.innerHTML = '';
        const doodle = document.createElement('css-doodle');
        doodle.innerHTML = code;
        if (className) doodle.className = className;
        if (style) Object.assign(doodle.style, style);
        containerRef.current.appendChild(doodle);
        }
    }, [code, className, style]);

    return <div ref={containerRef} />;
}