'use client';
import { usePathname } from 'next/navigation';

import CssDoodle from '@/components/CssDoodle';
import styles from '@/styles/base.module.scss';

const doodleCode = `
    :doodle {
        @grid: 1x120;
        overflow: visible;
        background: radial-gradient(circle at center, #ffffff 0%, #e0f7fa 100%);
    }

    @size: @r(10px, 20px);
    position: absolute;
    top: @r(0%, 100%);
    left: @r(0%, 100%);

    background: @pick(
        #f9c74f, #90be6d, #f94144, #577590, #f8961e, #43aa8b, #ffcad4, #b5ead7
    );
    border-radius: @pick(
        30% 70% 70% 30% / 30% 30% 70% 70%,
        50% 50% 50% 50% / 40% 60% 60% 40%,
        60% 40% 40% 60% / 50% 50% 50% 50%
    );
    opacity: @r(0.4, 0.8);
    box-shadow: 0 0 @r(2px, 6px) rgba(0,0,0,0.1);

    animation: @pick(
        bounce @r(3s, 6s) ease-in-out infinite alternate,
        spin @r(4s, 8s) linear infinite,
        pulse @r(5s, 9s) ease-in-out infinite
    );

    @keyframes bounce {
        to {
        transform: translateY(@r(-10px, 10px)) scale(@r(0.9, 1.1));
        }
    }

    @keyframes spin {
        to {
        transform: rotate(@r(360deg));
        }
    }

    @keyframes pulse {
        to {
        opacity: @r(0.2, 0.9);
        transform: scale(@r(0.8, 1.2));
        }
    }
`;

export default function PlayfulDoodle() {
    const pathname = usePathname();

    const getBackgroundClass = () => {
        if (pathname !== '/') {
            return styles.defaultBackground;
        } else {
            return styles.loginBackground;
        }
    };
    return <CssDoodle code={doodleCode} className={getBackgroundClass()} />;
}
