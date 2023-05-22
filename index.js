const express = require('express');
const mysql = require('mysql');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const uuid = require('uuid');
const request =  require('request');
const cors = require('cors');
const app = express();
app.use(cors());

const port = parseInt(process.env.PORT) || 8080;
app.use(express.json()); // parse JSON data sent in requests

// Create a connection to the database
//const con = mysql.createConnection({
//    host: 'localhost',
//    user: 'root',
//    password: '',
//    database: 'qanalyze_server',
//  });
  
  // Connect to the database
//  con.connect((err) => {
//    if (err) {
//      console.error('Error connecting to database: ', err);
//      return;
//    }
//    console.log('Connected to database!');
//  });
const user =  [
    {"user":"userrr"},{"user":"userrr"},{"user":"userrr"}
]

// ==================================================== //
// Job for calling Api
// cron.schedule("*/1 * * * * *", function () {
//   console.log("---------------------");
//   con.query("SELECT * FROM user_transcripts", function (error, results, fields) {
//     if (error) throw error;
//     console.log(results);
//   });
//   console.log("running a task every 1 seconds");
// });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send();
});

// ====================================================== //
// API CRUD
// ====================================================== //

app.get('/', (req, res) => {
    const status = {
        "status": "UP",
    }
    res.send(user)
});


// ================================================= //
// ================================================= //
//API for Appstore reviews
async function fetchReviews(app, country, page) {

    let url = 'http://itunes.apple.com/rss/customerreviews/page=' + page + '/id=' + app + '/sortby=mostrecent/json?cc=' + country;
  
    return new Promise((resolve, reject) => {
        let reviews = [];
        request(url, function(err, res, body) {
  
            if(!err && res.statusCode == 200) {
                let jsonData = JSON.parse(body);
                let entry = jsonData['feed']['entry'];
  
                for (const rawReview of entry) {
                    try
                    {		
                        let comment = {};
                        // comment['id'] = rawReview['id']['label'];
                        // comment['author'] = rawReview['author']['name']['label'];
                        // comment['version'] = rawReview['im:version']['label'];
                        // comment['rate'] = rawReview['im:rating']['label'];
                        // comment['title'] = rawReview['title']['label'];
                        comment['comment'] = rawReview['content']['label'];
  
                        reviews.push(comment);
                    }
                    catch (err) 
                    {
                        console.log(err);
                        reject(err);
                    }
                }
                resolve(reviews);
            } else {
                reject(err);
            }
        });
    });
  }
  app.post('/fetch_app_store', async (req, res) => {
    const url = req.body.url;
    let reviews = [];
    const delay = ms => new Promise(res => setTimeout(res, ms));
    console.log(url);
    const id = url.match(/id(\d+)/)[1];
    console.log(id);
    console.log(uuid.v1());
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let attempts = 0;
    while (attempts < 3) { // Try up to 3 times
        try {
            await page.goto(url);
            break; // Exit the loop if navigation is successful
        } catch (err) {
            attempts++;
            if (attempts >= 3) {
                return res.status(500).send('Internal Server Error');
            }
            // If navigation fails, log the error and try again
            console.error(`Failed to navigate to ${url}: ${err.message}`);
            await delay(1000); // Wait for 1 second before trying again
        }
    }
    console.log('reached!');
    await delay(5000);
    const headerTitle = await page.$eval('.product-header__title', el => el.textContent.trim(), { timeout: 3000 });
    console.log(headerTitle);
    const imgSrc = await page.$eval('.we-artwork source', el => el.getAttribute('srcset'));
    console.log(imgSrc);
    const whiteSpace = imgSrc.indexOf(' ');
    let partBeforeWhitespace;
    if (whiteSpace !== -1) {
        partBeforeWhitespace = imgSrc.substring(0, whiteSpace);
        console.log(partBeforeWhitespace);
    }
    await delay(5000);
    await page.screenshot({ path: '222yt.png', fullPage: true });
    const appId = id;
    const countryCode = 'us';
    const numPages = 2;
    let pageNo = 1;
    try {
        for (pageNo = 1; pageNo <= numPages; pageNo++) {
            const url22 = `http://itunes.apple.com/rss/customerreviews/page=${pageNo}/id=${appId}/sortby=mostrecent/json?cc=${countryCode}`;
            try {
              const fetchedReviews = await fetchReviews(id, countryCode, pageNo);
              console.log('feeeetch', fetchedReviews);
              reviews = [...reviews, ...fetchedReviews];
          } catch (err) {
              console.log(err);
          }
        }
        // console.log(reviews);
        // console.log(reviews.comment);
        console.log('Hi');
        const allComments = [];
        reviews.forEach(review => {
          allComments.push(review.comment);
        });
        const allCommentsArray = [allComments.join('\n')];
        console.log(allCommentsArray);
        const transcript_id = uuid.v1();
        const datasource_uid = '123_ssjhs_ssks';
        const user_id = 1;
        const type = 'App Store Reviews';
        const is_processed = false;
        const title = headerTitle;
        const image = partBeforeWhitespace;

          const input_text = allCommentsArray;
          //const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
          //const values = [transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, allCommentsArray.length];
          // const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
          // const values = [transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed];
          //con.query(sql, values, (err, result) => {
          //  if (err) {
          //    console.error('Error inserting record into database: ', err);
          //  } else {
          //    console.log('Record inserted successfully!');
          //  }
          //});
       
  
        return res.status(200).json(reviews);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal Server Error');
    } finally {
        await browser.close();
    }
    
  });
  
// ================================================= //
// ================================================= //
//API for playstore reviews
app.post('/fetch_play_store', async(req, res)=>{
    const url = req.body.url;
    console.log(url);
    const delay = ms => new Promise(res=>setTimeout(res, ms));
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    //const status = {
    //  "status": "UP",
 // }
 // res.send(url)
    let attempts = 0;
      while (attempts < 3) { // Try up to 3 times
        try {
          await page.goto(url);
          delay(2000);
          break; // Exit the loop if navigation is successful
        } catch (err) {
          attempts++;
          if (attempts >= 3) {
            //await page.screenshot({ path: 'yt.png', fullPage:true });
  
            return res.status(500).send('Internal Server Error');
          }
          // If navigation fails, log the error and try again
          console.error(`Failed to navigate to ${url}: ${err.message}`);
          await delay(1000); // Wait for 1 second before trying again
            return res.status(500).send('Internal Server Error');
        }
      }
    
    await delay(500)
    //await page.screenshot({ path: 'p3.png', fullPage:true });
    let selector = '.Il7kR';
    let elementHandleImage = null;
    let htmlContentImage = null;
    let attempts2 = 0;

    while (!elementHandleImage && attempts2 < 5) {
    try {
        elementHandleImage = await page.waitForSelector(selector, { timeout: 5000 });
        htmlContentImage = await page.evaluate(element => element.innerHTML, elementHandleImage);
    } catch (error) {
        console.log(`Could not find ${selector} selector. Trying other selectors...`);
        if (selector === '.Il7kR') {
        selector = '.qxNhq';
        } else if (selector === '.qxNhq') {
        selector = '.other-selector';
        } else {
        selector = '.Il7kR';
        }
        attempts2++;
    }
    }
    if (!elementHandleImage) {
    console.log('Could not find image selector after multiple attempts');
    return res.status(500).send('Internal Server Error');
    }
    const $ = cheerio.load(htmlContentImage);
    const src = $('img').attr('src');
    console.log('Image source:', src);
    const elementHandle = await page.waitForSelector('.Fd93Bb');
    const htmlContent = await page.evaluate(element => element.textContent, elementHandle);
    console.log(htmlContent);
    // let selector = '.Il7kR';
    // const elementHandle = await page.waitForSelector('.Fd93Bb');
    // const htmlContent = await page.evaluate(element => element.textContent, elementHandle);
    // let elementHandleImage = null;
    // let htmlContentImage = null;
    // try {
    //   elementHandleImage = await page.waitForSelector(selector);
    //   htmlContentImage = await page.evaluate(element => element.innerHTML, elementHandleImage);
    // } catch (error) {
    //   console.log(`Could not find ${selector} selector. Trying qxNhq selector...`);
    //   selector = '.qxNhq';
    //   elementHandleImage = await page.waitForSelector(selector);
    //   htmlContentImage = await page.evaluate(element => element.innerHTML, elementHandleImage);
    // }
  
    // const $ = cheerio.load(htmlContentImage);
    // const src = $('img').attr('src');
    // console.log('Image source:', src);
   
    // console.log(htmlContent);
    // console.log(htmlContentImage);
    // console.log(htmlContent);
  
    // try {
    //   const buttons = await page.$$('.VfPpkd-LgbsSe');
    //   let seeAllReviewsButton = null;
    //   for (const button of buttons) {
    //     const textContent = await button.evaluate(node => node.textContent);
    //     if (textContent === 'See all reviews') {
    //       seeAllReviewsButton = button;
    //       break;
    //     }
    //   }
    //   if (!seeAllReviewsButton) {
    //     return res.status(500).send('Internal Server Error');
    //     // throw new Error('Could not find "See all reviews" button');
    //   }
    //   await seeAllReviewsButton.click();
    //   // continue with the rest of the code
    // } catch (error) {
    //   // handle the error and return an error response
    //   console.error(error);
    //   res.status(500).send('Please try again!');
    // }

    let seeAllReviewsButton = null;
    let retries = 0;
    const maxRetries = 5;
    let textContent;
    while (!seeAllReviewsButton && retries < maxRetries) {
    try {
        const buttons = await page.$$('.VfPpkd-LgbsSe');
        for (const button of buttons) {
        textContent = await button.evaluate(node => node.textContent);
        if (textContent === 'See all reviews') {
            seeAllReviewsButton = button;
            break;
        }
        }
        if (!seeAllReviewsButton) {
        console.log(`Could not find "See all reviews" button. Retrying (${retries + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Please try again!');
    }
    retries++;
    }
    if (!seeAllReviewsButton) {
    return res.status(500).send('Internal Server Error');
    // throw new Error('Could not find "See all reviews" button');
    }
    await seeAllReviewsButton.click();
    // continue with the rest of the code

    //await page.screenshot({ path: 'p2.png', fullPage:true });
    await page.waitForSelector('.RHo1pe', {visible: true, timeout: 5000});
    // let reviews = [];
    // let counter = 1;
    // while (reviews.length < 100) {
    //   const reviewEls = await page.$$('.h3YV2d');
    //   const newReviews = await Promise.all(reviewEls.map(async (reviewEl) => {
    //     const reviewText =  await reviewEl.evaluate((el) => el.textContent.trim());
    //     return reviewText + '\n';
    //   }));
    //   reviews = reviews.concat(newReviews);
    //   await page.evaluate(() => {
    //     window.scrollTo(0, document.body.scrollHeight);
    //   });
    //   await delay(500);
    // }
    let reviews = [];
    let counter = 1;
    let reviewEls;
    let newReviews
    let reviewText
    try {
    while (reviews.length < 100) {
        reviewEls = await page.$$('.h3YV2d');
        newReviews = await Promise.all(reviewEls.map(async (reviewEl) => {
        reviewText = await reviewEl.evaluate((el) => el.textContent.trim());
        return reviewText + '\n';
        }));
        reviews = reviews.concat(newReviews);
        await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        });
        await delay(500);
    }
    await browser.close();
    } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
    }
    await browser.close();

    const transcript_id = '_22jswgswgvss';
    const datasource_uid = 'sss-jsu2-sn3';
    const user_id = 1;
    const type = 'PlayStore Reviews';
    const is_processed = false;
    const title = htmlContent;
    const input_text = mysql.escape(reviews);
    const image = src;
    const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, reviews.length];
    // const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    // const values = [transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed];
    //con.query(sql, values, (err, result) => {
     // if (err) {
    //    console.error('Error inserting record into database: ', err);
    //    res.status(500).send('Internal Server Error');
    //    return;
    //  }
      console.log('Record inserted successfully!');
      console.log(reviews);
      
      return res.status(201).json({
        success: true,
        message: 'Source Added successfully!',
        data : reviews
      });
    //});
     
});
// ================================================= //
// ================================================= //
//API for trust pilot reviews
app.post('/fetch_trust_pilot', async(req, res)=>{
    let reviews = [];
    let url = req.body.url;
    console.log('urk:', url);
    const delay = ms => new Promise(res=>setTimeout(res, ms));
  
    // let url = 'https://www.trustpilot.com/review/www.dugood.org'
    const browser = await puppeteer.launch();
    
    const page = await browser.newPage();
    //  await page.goto(url)
    let attempts = 0;
    while (true) { // Try up to 3 times
      try {
        await page.goto(url);
         break; // Exit the loop if navigation is successful
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
            
          return res.status(500).send('Internal Server Error');
        }
        // If navigation fails, log the error and try again
        console.error(`Failed to navigate to ${url}: ${err.message}`);
        await delay(3000); // Wait for 1 second before trying again
      }
    }
    console.log('reached!');
    await page.screenshot({ path: 'yt.png', fullPage:true });
    
    let retries = 0;
    let htmlContent
    let elementHandle2
    while (retries < 3) {
      try {
        elementHandle2 = await page.waitForSelector('.link_disabled__mIxH1');
        htmlContent = await page.evaluate(element => element.textContent, elementHandle2);
        console.log(htmlContent);
        break; // Exit the loop if there are no errors
      } catch (err) {
        console.log(`Error: ${err.message}`);
        retries++;
      }
    }
    if (retries === 3) {
      console.log('Max retries exceeded');
      // Return an error or take some other action here
    }
    let image;
    const html = await page.content(); // get page HTML
    const $ = cheerio.load(html); // load HTML into Cheerio
  
    const imageUrl = $('img.business-profile-image_image__jCBDc').attr('src'); // get the 'src' attribute of the image
    image = imageUrl;
    console.log(imageUrl);
  
    // while (reviews.length < 300) {
    // try {
    //     // get all review elements
    //     const reviewElems = await page.$$('.typography_body-l__KUYFJ');
    //     // extract text from review elements
    //     for (const elem of reviewElems) {
    //         const reviewText = await page.evaluate(el => el.textContent, elem);
    //         reviews.push(reviewText);
    //      }
    //     // check if there's a "next page" button
    //     console.log('now clicking the button');
    //     const nextPageButton = await page.$('.link_internal__7XN06');
    //     if (!nextPageButton) {
    //     console.log('button not found');
    //     break; // exit loop if no more pages
    //     }
    //     // click "next page" button and wait for navigation
    //     await Promise.all([
    //     nextPageButton.click(),
    //     page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 })
    //     ]);
    // } catch (error) {
    //     console.error(error);
    //     return res.status(500).send('Internal Server Error');
    //     break;
    // }
    // }

    let retries2 = 0;
    let reviewElems;
    let reviewText;
    while (reviews.length < 300 && retries2 < 3) {
    try {
        reviewElems = await page.$$('.typography_body-l__KUYFJ');
        for (const elem of reviewElems) {
        reviewText = await page.evaluate(el => el.textContent, elem);
        reviews.push(reviewText);
        }
        const nextPageButton = await page.$('.link_internal__7XN06');
        if (!nextPageButton) {
        console.log('No more pages');
        break;
        }
        await Promise.all([
        nextPageButton.click(),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        ]);
        console.log('Navigated to next page');
    } catch (error) {
        console.error(error);
        retries2++;
        console.log(`Retrying (${retries2})...`);
        continue;
    }
    }
    if (retries2 >= 3) {
    console.error('Failed to scrape reviews after 3 retries');
    return res.status(500).send('Internal Server Error');
    }
    console.log(`Scraped ${reviews.length} reviews`);

    const R_count = reviews.length ;
    const transcript_id = uuid.v1();
    const datasource_uid = 'ssnfhd-d-3d-3';
    const user_id = 1;
    const type = 'Trust Pilot Reviews';
    const is_processed = false;
    const title = htmlContent;
    const input_text = mysql.escape(reviews);
    const imageG = image;
    console.log(R_count);
    const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [transcript_id, datasource_uid, user_id, title, input_text, imageG, type, is_processed, R_count];
    // const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    // const values = [transcript_id, datasource_uid, user_id, title, input_text, imageG, type, is_processed];
    con.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting record into database: ', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      console.log('Record inserted successfully!');
      return res.status(201).json({
        success: true,
        message: 'Source Added successfully!',
        transcript_id,
      });
    });
    console.log(reviews.length);
    await browser.close();
      
})
// ================================================= //
// ================================================= //
//API for Google reviews
app.post('/fetch_google', async(req,res)=>{
    console.log(req.body);
    let url = req.body.url
    let reviews = [];
     const delay = ms => new Promise(res=>setTimeout(res, ms));
    console.log(url);
      // let url = 'https://www.google.com/maps/place/Arbisoft/@31.4663663,74.154088,12z/data=!4m22!1m15!4m14!1m6!1m2!1s0x391902194b5f4fa5:0x77760d1db4c96beb!2sArbisoft,+25+Canal+Rd,+Westwood+Colony+Lahore,+Punjab+54000,+Pakistan!2m2!1d74.2364904!2d31.4662463!1m6!1m2!1s0x391902194b5f4fa5:0x77760d1db4c96beb!2sarbisoft!2m2!1d74.2364904!2d31.4662463!3m5!1s0x391902194b5f4fa5:0x77760d1db4c96beb!8m2!3d31.4662463!4d74.2364904!16s%2Fg%2F11cfc_3yx'
  
      const browser = await puppeteer.launch();
      
      const page = await browser.newPage();
      //  await page.goto(url)
      let attempts = 0;
      while (attempts < 3) { // Try up to 3 times
        try {
          await page.goto(url);
           break; // Exit the loop if navigation is successful
        } catch (err) {
          attempts++;
          if (attempts >= 3) {
   
            return res.status(500).send('Internal Server Error');
          }
          // If navigation fails, log the error and try again
          console.error(`Failed to navigate to ${url}: ${err.message}`);
          await delay(1000); // Wait for 1 second before trying again
        }
      }
      console.log('reached!');
      await delay(5000)
    //   // hh2c6 
    //   const overBtn = await page.waitForSelector('.hh2c6')
    //   await overBtn.click();
    //   await delay(5000)
    //   await page.screenshot({ path: '222yt.png', fullPage:true });
    //   const textContent = await page.$eval('.DUwDvf', el => el.textContent.trim(), {timeout: 5000});
    //   console.log(textContent);
    //   // fetching image
    //   // aoRNLd 
    //   const imageELement = await page.waitForSelector('.RZ66Rb', {visible: true, timeout: 2000});
    //   const ImagetextContent = await imageELement.evaluate(el => el.innerHTML);
    //   console.log(ImagetextContent, 'InnerHtml');
    //   const imgSrc = await page.$eval('button[jsaction="pane.heroHeaderImage.click"] img', el => el.getAttribute('src'));
    //   console.log(imgSrc);
  
    // const html = await page.content(); // get page HTML
    // const $ = cheerio.load(html); // load HTML into Cheerio=
    // const imageUrl2 = ImagetextContent.attr('src');
    // const imageUrl = $('img').attr('src'); // get the 'src' attribute of the image
    // image = imageUrl;
    // console.log(imageUrl2);

    let retries3 = 0;
    let imageELement;
    let ImagetextContent;
    let imgSrc;
    let textContent;
    while (retries3 < 3) {
    try {
        const overBtn = await page.waitForSelector('.hh2c6', {timeout: 5000});
        await overBtn.click();
        await delay(5000);
        await page.screenshot({ path: '222yt.png', fullPage:true });
        textContent = await page.$eval('.DUwDvf', el => el.textContent.trim(), {timeout: 5000});
        console.log(textContent);
        imageELement = await page.waitForSelector('.RZ66Rb', {visible: true, timeout: 2000});
        ImagetextContent = await imageELement.evaluate(el => el.innerHTML);
        console.log(ImagetextContent, 'InnerHtml');
        imgSrc = await page.$eval('button[jsaction="pane.heroHeaderImage.click"] img', el => el.getAttribute('src'));
        console.log(imgSrc);
        break; // exit loop on success
    } catch (error) {
        console.error(error);
        retries3++;
        if (retries3 === 3) {
        return res.status(500).send('Internal Server Error');
        }
        await page.reload({ waitUntil: 'networkidle0' });
        }
    }   
    let reviewsButton
      console.log('now clicking the button');
      await delay(5000);
      reviewsButton = await page.$('.EIgkw', {timeout:5000});
      if (!reviewsButton) {
      console.log('button not found');
      return null;
      }
      // click "next page" button and wait for navigation
      reviewsButton.click();
      await delay(4000)
      await page.screenshot({ path: '222yt.png', fullPage:true });
      // const reviewCount = await page.$eval('.jANrlb button', el => el.textContent.trim());
      // console.log(reviewCount); // will output "146 reviews"
      const reviewCountText = await page.$eval('.jANrlb button', el => el.textContent.trim());
      const reviewCountMatch = reviewCountText.match(/(\d+)/);
      const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[1]) : null;
      console.log(reviewCount); // will output 146
       
      while (reviews.length < reviewCount) {
        try {
            // get all review elements
            const reviewElems = await page.$$('.wiI7pd');
    
            // extract text from review elements
            for (const elem of reviewElems) {
            const reviewText = await page.evaluate(el => el.textContent, elem);
              reviews.push(reviewText);
             }
    
            // check if there's a "next page" button
            console.log('now Scrolling down the button');
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await delay(500);
        } catch (error) {
            console.error(error);
            break;
        }
      }
      console.log(reviews);
      console.log(reviews.length);
      console.log(reviewCount);
      
      // adding data to mysql database
      await browser.close();
      const transcript_id = uuid.v1();
      const datasource_uid = 'thd_373d_d20';
      const user_id = 1;
      const type = 'Google Reviews';
      const is_processed = false;
      const title = textContent;
      const input_text = mysql.escape(reviews);
      const image = imgSrc;
      const Rcount = reviews.length
      const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, reviewCount];
      // const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      // const values = [transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed];
      con.query(sql, values, (err, result) => {
        if (err) {
          console.error('Error inserting record into database: ', err);
          res.status(500).send('Internal Server Error');
          return;
        }
        console.log('Record inserted successfully!');
        return res.status(201).json({
          success: true,
          message: 'Source Added successfully!',
          transcript_id,
        });
      });   
  
})
// ================================================= //
// ================================================= //
//API YouTube Reviews
app.post('/fetch_youtube', async(req, res)=>{
    let url = req.body.url
    console.log(req.body);
    // let url = 'https://www.youtube.com/watch?v=s8lK8Qhifks';
    let reviews = [];
      const delay = ms => new Promise(res=>setTimeout(res, ms));
      console.log(url);
      // let url = 'https://www.google.com/maps/place/Arbisoft/@31.4663663,74.154088,12z/data=!4m22!1m15!4m14!1m6!1m2!1s0x391902194b5f4fa5:0x77760d1db4c96beb!2sArbisoft,+25+Canal+Rd,+Westwood+Colony+Lahore,+Punjab+54000,+Pakistan!2m2!1d74.2364904!2d31.4662463!1m6!1m2!1s0x391902194b5f4fa5:0x77760d1db4c96beb!2sarbisoft!2m2!1d74.2364904!2d31.4662463!3m5!1s0x391902194b5f4fa5:0x77760d1db4c96beb!8m2!3d31.4662463!4d74.2364904!16s%2Fg%2F11cfc_3yx'
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      //  await page.goto(url)
      let attempts = 0;
      while (attempts < 3) { // Try up to 3 times
        try {
          await page.goto(url);
           break; // Exit the loop if navigation is successful
        } catch (err) {
          attempts++;
          if (attempts >= 3) {
            return res.status(500).send('Internal Server Error');
          }
          // If navigation fails, log the error and try again
          console.error(`Failed to navigate to ${url}: ${err.message}`);
          await delay(1000); // Wait for 1 second before trying again
        }
      }
      await delay(5000)
      console.log('reached!');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await delay(500);
      const imageDiv = await page.$eval('#top-row #img', el=>el.getAttribute('src'));
      console.log('img', imageDiv);
      // const title_yt = await page.$eval('#above-the-fold #title yt-formatted-string', el=>el.outerHTML);
      // console.log('title',title_yt);
      const h1Text = await page.$eval('#above-the-fold #title h1 yt-formatted-string', el => el.textContent);
      console.log(h1Text);
  
      let reviewText;
      let reviewElems;
      while (reviews.length <450) {
        try {
          // Find all review elements
          reviewElems = await page.$$('#content-text');
          for (const elem of reviewElems) {
            reviewText = await page.evaluate(el => el.textContent, elem);
            reviews.push(reviewText);
            console.log(reviewText);
          }
          // Scroll down to load more reviews
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          await delay(500);
        } catch (error) {
          console.error(error);
          break;
        }
      }
      
      console.log(reviews);
      console.log(reviews.length);
      await page.screenshot({ path: '22.png', fullPage:true });
      await delay(5000)
      // browser close
      await browser.close();
      // DB querry
      const transcript_id = uuid.v1();
      const datasource_uid = 'yt_re1820ssw3';
      const user_id = 1;
      const type = 'Youtube Reviews';
      const is_processed = false;
      const title = h1Text;
      const input_text = mysql.escape(reviews);
      const image = imageDiv;
      const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, reviews.length];
      con.query(sql, values, (err, result) => {
        if (err) {
          console.error('Error inserting record into database: ', err);
          res.status(500).send('Internal Server Error');
          return;
        }
        console.log('Record inserted successfully!');
        return res.status(201).json({
          success: true,
          message: 'Source Added successfully!',
          transcript_id,
        });
      });   
    
    
})


app.post('/tsX', async (req, res) => {
    try {
      let reviews = [];
      let url = req.body.url;
      console.log('url:', url);
      const delay = ms => new Promise(res => setTimeout(res, ms));
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      let attempts = 0;
      while (true) {
        try {
          await page.goto(url);
          break;
        } catch (err) {
          attempts++;
          if (attempts >= 3) {
            console.error(`Failed to navigate to ${url}: ${err.message}`);
            return res.status(500).send('Internal Server Error');
          }
          console.error(`Failed to navigate to ${url}: ${err.message}`);
          await delay(3000);
        }
      }
      console.log('reached!');
      await page.screenshot({ path: 'yt.png', fullPage: true });
      while(true){
        try {
            const elementHandle2 = await page.waitForSelector('.link_disabled__mIxH1');
            const htmlContent = await page.evaluate(element => element.textContent, elementHandle2);
            console.log(htmlContent); 
            break;
        } catch (error) {
            console.error(`Failed to navigate to ${url}: ${err.message}`);
            await delay(3000);   
        }
      }
      let image;
      while(true){
        try {
            const html = await page.content();
            const $ = cheerio.load(html);
            const imageUrl = $('img.business-profile-image_image__jCBDc').attr('src');
            image = imageUrl;
            console.log(imageUrl);
            break;
        } catch (error) {
            console.error(`Failed to navigate to ${url}: ${err.message}`);
            await delay(3000);   
        }
      }
      while (reviews.length < 300) {
        try {
          const reviewElems = await page.$$('.typography_body-l__KUYFJ');
          for (const elem of reviewElems) {
            const reviewText = await page.evaluate(el => el.textContent, elem);
            reviews.push(reviewText);
          }
          const nextPageButton = await page.$('.link_internal__7XN06');
          if (!nextPageButton) {
            console.log('button not found');
            break;
          }
          await Promise.all([
            nextPageButton.click(),
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 })
          ]);
        } catch (error) {
          console.error(error);
          return res.status(500).send('Internal Server Error');
        }
      }
      const R_count = reviews.length;
      const transcript_id = uuid.v1();
      const datasource_uid = 'ssnfhd-d-3d-3';
      const user_id = 1;
      const type = 'Trust Pilot Reviews';
      const is_processed = false;
      const title = htmlContent;
      const input_text = mysql.escape(reviews);
      const imageG = image;
      console.log(R_count);
      const sql = 'INSERT INTO user_transcripts (transcript_id, datasource_uid, user_id, title, input_text, image, type, is_processed, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [transcript_id, datasource_uid, user_id, title, input_text, imageG, type, is_processed, R_count];
      con.query(sql, values, (err, result) => {
        if (err) {
          console.error('Error inserting record into database: ', err);
          return res.status(500).send('Internal Server Error');
        }
        console.log('Record inserted successfully!');
        return res.status(201).json({
          success: true,
          message: 'Source Added successfully!',
          transcript_id,
        });
      });
      console.log(reviews.length);
      await browser.close();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong, please try again later'
    });
    }
});

// ====================================================== //
// API END
// ====================================================== //
 
// ================================================= //
// Listening server on port

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Exports for testing purposes.
module.exports = app;