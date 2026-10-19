const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox = { module: { exports: {} }, console, require: () => ({}) };
vm.runInNewContext(fs.readFileSync(require.resolve('../pricing-checkout'), 'utf8'), sandbox);
const { findProCardUpgradeButton, PRO_CARD_ACTION, PRO_CARD_TITLE, isPricingPlanSelectorVisible } = sandbox.module.exports;

const list = (items) => ({ count: async () => items.length, nth: (index) => items[index] });
function pageWithCards(cards) {
    const titles = cards.map(({ actions, otherPlan = false, enabled = true }) => {
        const button = { isVisible: async () => true, isEnabled: async () => enabled };
        const boundary = { evaluate: async () => true };
        const parent = {
            evaluate: async () => otherPlan,
            getByRole: (role, options) => { assert.equal(role, 'button'); return list(actions.filter((name) => options.name.test(name)).map(() => button)); },
            locator: () => boundary
        };
        return { isVisible: async () => true, locator: () => parent };
    });
    return { getByText: (pattern) => { assert.equal(pattern, PRO_CARD_TITLE); return list(titles); } };
}

test('matches Pro titles and subscription wording without wallet or Plus actions', () => {
    for (const name of ['ChatGPT Pro', 'Pro', 'ChatGPT Pro 500']) assert.match(name, PRO_CARD_TITLE);
    for (const name of ['开始订阅', 'Subscribe', 'Subscribe to Pro', 'Start subscription', 'Get Pro', 'Upgrade to Pro']) assert.match(name, PRO_CARD_ACTION);
    for (const name of ['Apple Pay', 'Google Pay', 'Get Plus', 'Upgrade to Plus']) assert.doesNotMatch(name, PRO_CARD_ACTION);
});
test('finds subscription button within Pro card without a test id', async () => {
    const page = pageWithCards([{ actions: ['开始订阅'] }]);
    assert.ok(await findProCardUpgradeButton(page));
    assert.equal(await isPricingPlanSelectorVisible(page, 'pro500'), true);
});
test('rejects shared containers, ambiguous cards and disabled buttons', async () => {
    for (const cards of [[], [{ actions: ['开始订阅'], otherPlan: true }], [{ actions: ['Subscribe', 'Get Pro'] }], [{ actions: ['Subscribe'] }, { actions: ['Subscribe'] }], [{ actions: ['Subscribe'], enabled: false }]]) {
        await assert.rejects(findProCardUpgradeButton(pageWithCards(cards)));
    }
});
