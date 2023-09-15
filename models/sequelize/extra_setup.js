const ConstData = require('../../util/const_data');

module.exports = async function (db) {
    const {Setting, SignatureCollection, User} = db.models;

    // Create admin user if not exist
    await User.findOrCreate({
        where: {email: process.env.ADMIN_EMAIL},
        defaults: {
            username: process.env.ADMIN_NAME,
            password: process.env.ADMIN_PASSSWORD,
            firstname: process.env.ADMIN_FIRSTNAME,
            lastname: process.env.ADMIN_LASTNAME,
            name: process.env.ADMIN_FIRSTNAME + ' ' + process.env.ADMIN_LASTNAME,
            job: process.env.ADMIN_JOB,
            company: process.env.ADMIN_COMPANY,
            type: ConstData.ADMIN_USER,
            verified: true
        }
    });

    // Create setting record if not exist
    await Setting.findOrCreate({
        where: {},
        defaults: {
            cron_running: false,
            orders_cron_running: false,
        }
    });

    await Setting.update({
        cron_running: false,
        orders_cron_running: false,
    }, {where: {}});

    // Create pre-defined signature collections if not exist
    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_25_COLLECTION_ID},
        defaults: {
            title: '$25 collection',
            type: 'gifts',
            sequence: 1
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_30_COLLECTION_ID},
        defaults: {
            title: '$30 collection',
            type: 'gifts',
            sequence: 2
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_40_COLLECTION_ID},
        defaults: {
            title: '$40 collection',
            type: 'gifts',
            sequence: 3
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_50_COLLECTION_ID},
        defaults: {
            title: '$50 collection',
            type: 'gifts',
            sequence: 4
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_65_COLLECTION_ID},
        defaults: {
            title: '$65 collection',
            type: 'gifts',
            sequence: 5
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_75_COLLECTION_ID},
        defaults: {
            title: '$75 collection',
            type: 'gifts',
            sequence: 6
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_100_COLLECTION_ID},
        defaults: {
            title: '$100 collection',
            type: 'gifts',
            sequence: 7
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_115_COLLECTION_ID},
        defaults: {
            title: '$115 collection',
            type: 'gifts',
            sequence: 8
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_150_COLLECTION_ID},
        defaults: {
            title: '$150 collection',
            type: 'gifts',
            sequence: 9
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_200_COLLECTION_ID},
        defaults: {
            title: '$200 collection',
            type: 'gifts',
            sequence: 10
        }
    });

    if (process.env.SHOPIFY_250_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_250_COLLECTION_ID},
            defaults: {
                title: '$250 collection',
                type: 'gifts',
                shopify: true,
                price: 250,
                sequence: 11
            }
        });
    }

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_LUXE_COLLECTION_ID},
        defaults: {
            title: 'Luxe collection',
            internal: true,
            sequence: 0
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_CUSTOM_COLLECTION_ID},
        defaults: {
            title: 'Custom collection',
            internal: true,
            sequence: 0
        }
    });

    await SignatureCollection.findOrCreate({
        where: {shopify_id: process.env.SHOPIFY_DONATION_COLLECTION_ID},
        defaults: {
            title: 'Donation collection',
            internal: true,
            type: 'donation',
            sequence: 0
        }
    });

    if (process.env.SHOPIFY_INTL_25_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_INTL_25_COLLECTION_ID},
            defaults: {
                title: 'International $25 collection',
                type: 'international',
                shopify: true,
                sequence: 10,
                price: 25,
            }
        });    
    }

    if (process.env.SHOPIFY_INTL_50_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_INTL_50_COLLECTION_ID},
            defaults: {
                title: 'International $50 collection',
                type: 'international',
                shopify: true,
                sequence: 20,
                price: 50,
            }
        });    
    }

    if (process.env.SHOPIFY_INTL_75_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_INTL_75_COLLECTION_ID},
            defaults: {
                title: 'International $75 collection',
                type: 'international',
                shopify: true,
                sequence: 25,
                price: 75,
            }
        });
    }

    if (process.env.SHOPIFY_INTL_100_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_INTL_100_COLLECTION_ID},
            defaults: {
                title: 'International $100 collection',
                type: 'international',
                shopify: true,
                sequence: 30,
                price: 100,
            }
        });    
    }

    if (process.env.SHOPIFY_INTL_150_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_INTL_150_COLLECTION_ID},
            defaults: {
                title: 'International $150 collection',
                type: 'international',
                shopify: true,
                sequence: 40,
                price: 150,
            }
        });    
    }

    if (process.env.SHOPIFY_INTL_200_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_INTL_200_COLLECTION_ID},
            defaults: {
                title: 'International $200 collection',
                type: 'international',
                shopify: true,
                sequence: 50,
                price: 200,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_5_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_5_COLLECTION_ID},
            defaults: {
                title: 'Charity $5 collection',
                type: 'donation',
                shopify: true,
                sequence: 500,
                price: 5,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_10_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_10_COLLECTION_ID},
            defaults: {
                title: 'Charity $10 collection',
                type: 'donation',
                shopify: true,
                sequence: 510,
                price: 10,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_15_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_15_COLLECTION_ID},
            defaults: {
                title: 'Charity $15 collection',
                type: 'donation',
                shopify: true,
                sequence: 520,
                price: 15,
            }
        });    
    }    

    if (process.env.SHOPIFY_CHARITY_25_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_25_COLLECTION_ID},
            defaults: {
                title: 'Charity $25 collection',
                type: 'donation',
                shopify: true,
                sequence: 530,
                price: 25,
            }
        });    
    }  

    if (process.env.SHOPIFY_CHARITY_30_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_30_COLLECTION_ID},
            defaults: {
                title: 'Charity $30 collection',
                type: 'donation',
                shopify: true,
                sequence: 540,
                price: 30,
            }
        });    
    }  

    if (process.env.SHOPIFY_CHARITY_40_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_40_COLLECTION_ID},
            defaults: {
                title: 'Charity $40 collection',
                type: 'donation',
                shopify: true,
                sequence: 550,
                price: 40,
            }
        });    
    }  

    if (process.env.SHOPIFY_CHARITY_50_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_50_COLLECTION_ID},
            defaults: {
                title: 'Charity $50 collection',
                type: 'donation',
                shopify: true,
                sequence: 560,
                price: 50,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_65_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_65_COLLECTION_ID},
            defaults: {
                title: 'Charity $65 collection',
                type: 'donation',
                shopify: true,
                sequence: 570,
                price: 65,
            }
        });    
    }
    
    if (process.env.SHOPIFY_CHARITY_75_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_75_COLLECTION_ID},
            defaults: {
                title: 'Charity $75 collection',
                type: 'donation',
                shopify: true,
                sequence: 580,
                price: 75,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_100_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_100_COLLECTION_ID},
            defaults: {
                title: 'Charity $100 collection',
                type: 'donation',
                shopify: true,
                sequence: 590,
                price: 100,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_115_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_115_COLLECTION_ID},
            defaults: {
                title: 'Charity $115 collection',
                type: 'donation',
                shopify: true,
                sequence: 600,
                price: 115,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_150_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_150_COLLECTION_ID},
            defaults: {
                title: 'Charity $150 collection',
                type: 'donation',
                shopify: true,
                sequence: 610,
                price: 150,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_200_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_200_COLLECTION_ID},
            defaults: {
                title: 'Charity $200 collection',
                type: 'donation',
                shopify: true,
                sequence: 620,
                price: 200,
            }
        });    
    }

    if (process.env.SHOPIFY_CHARITY_250_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_250_COLLECTION_ID},
            defaults: {
                title: 'Charity $250 collection',
                type: 'donation',
                shopify: true,
                sequence: 630,
                price: 250,
            }
        });
    }

    if (process.env.SHOPIFY_CHARITY_500_COLLECTION_ID) {
        await SignatureCollection.findOrCreate({
            where: {shopify_id: process.env.SHOPIFY_CHARITY_500_COLLECTION_ID},
            defaults: {
                title: 'Charity $500 collection',
                type: 'donation',
                shopify: true,
                sequence: 640,
                price: 500,
            }
        });
    }
}
