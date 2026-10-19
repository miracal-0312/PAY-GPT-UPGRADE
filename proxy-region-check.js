'use strict';

async function assertChileRequestCountry(context, country) {
    if (String(country).toUpperCase() !== 'CL') return;

    console.log('[代理地区检查] 正在通过当前任务代理查询出口国家，期望: CL');
    let info;
    try {
        const response = await context.request.get('https://ipinfo.io/json', { timeout: 15000 });
        if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
        info = await response.json();
        if (!info || !/^[A-Z]{2}$/i.test(String(info.country || '')) || !info.ip) {
            throw new Error('查询结果缺少有效 IP 或国家代码');
        }
    } catch (error) {
        throw new Error(`无法确认智利出口地区，已停止创建 Checkout: ${error.message}`);
    }

    const actualCountry = String(info.country).toUpperCase();
    const maskedIp = String(info.ip).includes(':')
        ? `${String(info.ip).split(':').slice(0, 2).join(':')}:…`
        : String(info.ip).replace(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/, '***.***.$3.$4');
    console.log(`[代理地区检查] IP=${maskedIp}, country=${actualCountry}, region=${info.region || '-'}, city=${info.city || '-'}, source=ipinfo.io`);
    if (actualCountry !== 'CL') {
        throw new Error(`代理出口国家不匹配: 账单地区=CL，查询出口=${actualCountry}；请使用智利出口代理后重试`);
    }
    console.log('[代理地区检查] 智利出口检查通过（第三方 IP 地理定位，最终以 Checkout 服务端判断为准）');
}

module.exports = { assertChileRequestCountry };
