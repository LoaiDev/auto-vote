const config = require('config');

const puppeteer = require('puppeteer-extra');

const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(
    RecaptchaPlugin({
        provider: {
            id: '2captcha',
            token: 'f804e7fb453a6117f3df546b9aaa054d' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
        },
        visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    }),
    StealthPlugin()
)

const sites = config.get('sites');
const singleMode = config.get('singleMode');
const playerName = config.get('playerName');

const chromSettings = {
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: [
        //  '--user-data-dir=C:\\users\\Loai Arkam\\AppData\\Local\\Chrom0e'
        //  `--proxy-server= http://159.203.44.118:8080`
    ]
};

(async () => {
    const browser = await puppeteer.launch(chromSettings)


    for (let index = 0; index < sites.length; index++) {
        singleMode ? await vote(browser, sites[index]) : vote(browser, sites[index]);
    }

})();

async function vote(browser, site) {
    return new Promise(function (resolve, reject) {
        var page;

        newPage(browser, site)
            .then(result => page = result)
            .then(_ => sleep(5000))
            .then(_ => inputName(page, site))
            .then(_ => sleep(5000))
            .then(_ => resolve(page))
            .catch(error => console.log(error))

    })
}

async function newPage(browser, site) {
    var page;
    return new Promise(function (resolve, reject) {
        browser.newPage()
            .then(result => {
                page = result;
                return Promise.all([
                    page.waitForNavigation({ timeout: 120000 }),
                    page.waitForSelector(site.inputSelector, { timeout: 120000 }),
                    page.goto(site.url, { timeout: 120000 }),
                ])
            })
            .then(_ => resolve(page))
            .catch(error => reject(error))
    })
}
async function inputName(page, site) {
    var inputField;

    return new Promise(function (resolve, reject) {
        page.$(site.inputSelector)
            .then(result => inputField = result)
            .then(_ => inputField.focus())
            .then(_ => site.clearText ? clearText(inputField, page) : inputField)
            .then(_ => inputField.type(playerName, { delay: 200 }))
            .then(_ => resolve(page))
            .catch(error => reject(error))
    })
}

async function selectBoxes(page, site) {
    let selectInput = await page.$(site.select.boxSelector);
    await selectInput.tap();
    return true;
}

async function solevCaptcha(page) {
    new elementHandle
    await page.solveRecaptchas()
}

function sleep(duration, value) {
    value = value || true;
    console.log("sleeping")
    return new Promise(function (resolve, reject) {
        setTimeout(() => resolve(value), duration);
    })
}

async function clearText(element, page) {
    return new Promise(function (resolve, reject) {
        page.keyboard.down('Shift')
            .then(_ => page.keyboard.press('KeyA'))
            .then(_ => page.keyboard.up('Shift'))
            .then(_ => page.keyboard.press('Backspace'))
            .then(_ => resolve(element))
            .catch(error => reject(error))
    })
}