const db = require('../sequelize');
const ProductBridge = require('./ProductBridge');

module.exports = {
    get_demo: async function () {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({where: {}, raw: true});

        const demo_products = demoCampaign['demo_products'] || '';
        const query = `SELECT DISTINCT ON("product_id") * FROM products WHERE '${demo_products}' LIKE '%' ||  "variant_id" || '%'`;
        let products = await db.sequelize.query(query, {
            type: db.Sequelize.QueryTypes.SELECT
        });

        products.sort((product1, product2) =>
            demo_products.indexOf(product1['variant_id']) - demo_products.indexOf(product2['variant_id']));

        return {campaign: demoCampaign, products};
    },

    get_campaign_email_preview: async function () {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({where: {}, raw: true});
        const sender_name = 'admin', sender_company = 'The Gifts for Good Team', receiver_name = 'John';
        let video = '', logo = '', banner = '', message = '';

        if (demoCampaign) {
            video = demoCampaign['demo_video'];
            logo = demoCampaign['demo_logo'] || '/resources/images/logo.svg';
            banner = demoCampaign['demo_banner'];
            message = demoCampaign['demo_message'];
        }

        message = message
            .split(':first_name').join('John')
            .split(':last_name').join('Doe')
            .split(':email').join('johndoe@email.com')
            .split(':company').join('xxx.tech.org')
            .split(':name').join('John Doe')
            .split(':sender_first_name').join('admin')
            .split(':sender_last_name').join('admin')
            .split(':sender_email').join('admin@giftsforward.com')
            .split(':sender_company').join('The Gifts for Good Team')
            .split(':sender_name').join('admin');
        return {sender_name, sender_company, receiver_name, message, video, logo, banner};
    },

    get_landing_page_preview: async function () {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({where: {}, raw: true});
        const from_first_name = 'admin', from_company_name = 'The Gifts for Good Team';
        let message = '', video_url = '', logo_url = '', banner_url = '', products = [];

        if (demoCampaign) {
            const products_ids = (demoCampaign['demo_products'] || '').split(',');
            products = await ProductBridge.get_products(products_ids);
            video_url = demoCampaign['demo_video'];
            logo_url = demoCampaign['demo_logo'];
            banner_url = demoCampaign['demo_banner'];
            message = demoCampaign['demo_message'];
        }
        message = message
            .split(':first_name').join('John')
            .split(':last_name').join('Doe')
            .split(':email').join('johndoe@email.com')
            .split(':company').join('xxx.tech.org')
            .split(':name').join('John Doe')
            .split(':sender_first_name').join('admin')
            .split(':sender_last_name').join('admin')
            .split(':sender_email').join('admin@giftsforward.com')
            .split(':sender_company').join('The Gifts for Good Team')
            .split(':sender_name').join('admin');

        return {
            from_first_name, from_company_name,
            campaign: {
                message, video_url, logo_url, banner_url, products
            }
        };
    },

    add_product: async function (product_id) {
        const {Setting, Product} = db.models;

        const demoCampaign = await Setting.findOne({where: {}});
        const product = await Product.findByPk(product_id);
        if (demoCampaign && product) {
            const demo_products = demoCampaign['demo_products'] || '';
            if (demo_products.indexOf(product['variant_id']) > -1) {
                return {status: false, msg: 'This product was already added.'};
            }
            await demoCampaign.update({demo_products: demo_products + ',' + product['variant_id']});
            return {status: true, msg: 'Product has been added.', product};
        } else {
            return {status: false, msg: 'Invalid param.'};
        }
    },

    remove_product: async function (product_id) {
        const {Product, Setting} = db.models;

        const product = await Product.findByPk(product_id);
        const demoCampaign = await Setting.findOne({where: {}});

        if (demoCampaign && product) {
            const demo_products = demoCampaign['demo_products'] || '';
            let temp_array = demo_products.split(',');
            const index = temp_array.indexOf(product['variant_id']);
            if (index > -1) {
                temp_array.splice(index, 1);
                await demoCampaign.update({demo_products: temp_array.join(',')});
            }
            return true;
        } else {
            return false;
        }
    },

    update_message: async function (message) {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({where: {}});

        if (demoCampaign) {
            await demoCampaign.update({demo_message: message});
            return true;
        } else {
            return false;
        }
    },

    use_default_logo: async function () {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({where: {}});

        if (demoCampaign) {
            await demoCampaign.update({demo_logo: ''});
            return '/resources/images/logo.svg';
        } else {
            return '';
        }
    },

    use_default_banner: async function () {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({where: {}});

        if (demoCampaign) {
            await demoCampaign.update({demo_banner: '/resources/images/default-banner.png'});
            return '/resources/images/default-banner.png';
        } else {
            return '';
        }
    },

    update_demo_experience: async function (file_type, file_link) {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({where: {}});

        if (demoCampaign) {
            let updateObj = {};
            if (file_type === 'logo') {
                updateObj.demo_logo = file_link;
            } else if (file_type === 'banner') {
                updateObj.demo_banner = file_link;
            }
            await demoCampaign.update(updateObj);
            return true;
        } else {
            return false;
        }
    },

    change_sequence: async function (changed_product_id, previous_product_id) {
        const {Setting} = db.models;
        const demoCampaign = await Setting.findOne({});
        if (demoCampaign) {
            const demo_products = demoCampaign['demo_products'];
            let tempArr = demo_products.split(',');
            const currentIndex = tempArr.indexOf(changed_product_id);
            // Remove at current index
            if (currentIndex > -1) {
                tempArr.splice(currentIndex, 1);
            }
            const previousIndex = tempArr.indexOf(previous_product_id);
            // Insert after the product
            if (previous_product_id && previousIndex > -1) {
                tempArr.splice(previousIndex, 0, changed_product_id);
            } else {
                tempArr.push(changed_product_id);
            }

            await demoCampaign.update({demo_products: tempArr.join(',')});
            return {status: true, msg: 'Product sequence has been changed.'};
        } else {
            return {status: false, msg: 'Invalid data.'};
        }
    },

    create_demo_contact: async function (first_name, last_name, company_name, email,
                                         from_company_name, banner, logo, video, message) {
        const {DemoContact} = db.models;
        return await DemoContact.create({
            to_first_name: first_name,
            to_last_name: last_name,
            to_company_name: company_name,
            to_email: email,
            from_company_name: from_company_name,
            message: message,
            banner_url: banner,
            logo_url: logo,
            video_url: video
        });
    },

    // Get contact from contact id
    get_contact: async function (contact_id) {
        const {DemoContact, Setting} = db.models;
        const contact = await DemoContact.findOne({where: {id: contact_id}});
        const demoCampaign = await Setting.findOne({where: {}, raw: true});

        if (contact && demoCampaign) {
            contact['campaign'] = {
                message: contact['message'],
                banner_url: contact['banner_url'],
                logo_url: contact['logo_url'],
                video_url: contact['video_url']
            };

            contact['campaign']['message'] = contact['campaign']['message']
                .split(':first_name').join(contact['to_first_name'])
                .split(':last_name').join(contact['to_last_name'])
                .split(':email').join(contact['to_email'])
                .split(':company').join(contact['to_company_name'])
                .split(':name').join(contact['to_first_name'] + ' ' + contact['to_last_name'])
                .split(':sender_first_name').join(contact['from_first_name'])
                .split(':sender_last_name').join(contact['from_last_name'])
                .split(':sender_email').join(contact['from_email'])
                .split(':sender_company').join(contact['from_company_name'])
                .split(':sender_name').join(contact['from_first_name'] + ' ' + contact['from_last_name']);

            const demo_products = demoCampaign['demo_products'] || '';
            const query = `SELECT DISTINCT ON("product_id") * FROM products WHERE '${demo_products}' LIKE '%' ||  "variant_id" || '%'`;
            let products = await db.sequelize.query(query, {
                type: db.Sequelize.QueryTypes.SELECT
            });
            products.sort((product1, product2) =>
                demo_products.indexOf(product1['variant_id']) - demo_products.indexOf(product2['variant_id']));
            for (let i = 0; i < products.length; i++) {
                if (products[i]['tags'].filter(item => item.trim() === 'donation').length) {
                    products[i]['is_donation'] = true;
                }
            }
            contact['campaign']['products'] = products;
        }
        return contact;
    },
}


