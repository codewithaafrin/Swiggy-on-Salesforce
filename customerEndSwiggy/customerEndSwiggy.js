import { LightningElement, wire, api, track } from 'lwc';
import exportCustomerEnd from "@salesforce/apex/CustomerEndLWC.exportCustomerEnd";
import exportCategoryPicklist from "@salesforce/apex/CustomerEndLWC.exportCategoryPicklist";
import Restaurant_Pics from '@salesforce/resourceUrl/RestaurantPics';
import Category_Pics from '@salesforce/resourceUrl/MenuCategories';
import returnParticularRestaurantAndMenu from "@salesforce/apex/CustomerEndLWC.returnParticularRestaurantAndMenu";
import insertDataToCart from "@salesforce/apex/CustomerEndLWC.insertDataToCart";
import userCredentials from "@salesforce/apex/CustomerEndLWC.userCredentials";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import approvalStatus from "@salesforce/apex/CustomerEndLWC.approvalStatus";
import deliveryProcessApprovals from "@salesforce/apex/CustomerEndLWC.deliveryProcessApprovals";
import exportDeliveryApprovalStatus from "@salesforce/apex/CustomerEndLWC.exportDeliveryApprovalStatus";
import insertReviewsReceived from "@salesforce/apex/CustomerEndLWC.insertReviewsReceived";
import searchParticularRestaurantMenuOrCategory from "@salesforce/apex/CustomerEndLWC.searchParticularRestaurantMenuOrCategory";
import { subscribe} from 'lightning/empApi';

export default class CustomerEndSwiggy extends LightningElement {
    
    menuAndRestaurantArray = [];
    RestPicTemp = [];
    wiredCategoryPicklist=[];
    Category_Pics=[];
    selectedCategory='';
    menuPage = false;
    selectedRestaurant = [];
    categoryMap=[];
    uniqueCategories=[];
    unique = [];
    listofMenu = [];
    menuItemList = [];
    countFinal=0;
    cartPage=false;
    loginPage=true;
    homePage=false;
    waitingPage=false;
    itemsInCartList=[];
    insertionarray=[];
    deliveryrating;
    username = '';
    password='';
    customerarray=[];
    selectedAddress='Home';
    cartId='';
    cartStatus='';
    acceptPage=false;
    declinePage=false;
    formattedTime = '00:00';
    streetName='';
    cityName='';
    countryName='';
    zipCodeValue='';
    stateName = '';
    customerIdToPass='';
    grandTotal = 0;
    deliveryPage=false;
    deliveryStatus='';
    deliveryPersonnelArray='';
    deliveryProcessId='';
    selectedMarkerValue='';
    completedDelivery='';
    reviewPage=false;
    showWorkAddress=false;
    showHomeAddress=true;
    searchKey='';
    @track data = [];
    @track columns = [
        { label: 'Status of Delivery', fieldName: 'Status_of_Delivery__c' }
    ];
    subscription = {};
    @api channelName = '/event/Delivery_Successful__e';

    connectedCallback() {
        this.getDetails();
        this.renderStars();
        this.handleSubscribe();
        this.takeToReviewPage();
        //this.sortMenuViaCategory();
    }

    getDetails() {
        exportCustomerEnd({getCategorySelected:this.selectedCategory}).then((result) => {
            this.menuAndRestaurantArray = result.map((iterator) => {
                let stars = this.renderStars(iterator.Rating__c);
                // Extract unique categories
                let uniqueCategories = [...new Set(iterator.Menu__r.map(menu => menu.Category__c))];
                //extract only 3
                //let uniqueCategories = iterator.Menu__r.map(menuItem => menuItem.Category__c).slice(0, 3);
                return {
                    ...iterator,
                    RestPicTemp: Restaurant_Pics + '/RestaurantPics/' + iterator.Restaurant_Pic_Name__c + '.jpg',
                    stars: stars,
                    UniqueCategories: uniqueCategories,
                };
            });
            console.log('this.menuAndRestaurantArray: ' + JSON.stringify(this.menuAndRestaurantArray));
        }).catch((error) => {
            this.error = error;
            this.menuAndRestaurantArray = undefined;
        });
    }

    renderStars(rating) {
        const numFilledStars = Math.ceil(rating);
            const hasHalfStar = rating % 1 === 0.5;
            const stars = '★'.repeat(numFilledStars);

            let starString = stars;


            const numEmptyStars = 5 - Math.ceil(rating);
            starString += '☆'.repeat(numEmptyStars);

            return starString;
    }

    sortMenuViaCategory(){
        const categoryMap = new Map();

    // Iterate through each restaurant in the array
    this.menuAndRestaurantArray.forEach(restaurant => {
        // Iterate through each menu item in the restaurant
        restaurant.Menu__r.forEach(menuItem => {
            const category = menuItem.Category__c;
            const foodInfo = {
                restaurantId: restaurant.Id,
                price: menuItem.price, // Replace with the actual property name for price
                foodType: menuItem.foodType, // Replace with the actual property name for foodType
                foodName: menuItem.foodName
            };

            // Check if the category is already in the map
            if (categoryMap.has(category)) {
                // If it exists, add the food info to the existing array
                categoryMap.get(category).push(foodInfo);
            } else {
                // If it doesn't exist, create a new array with the food info
                categoryMap.set(category, [foodInfo]);
            }
        });
    });

    // Log or use the created categoryMap
    console.log('Category Map:', categoryMap);

    // If you want to use this map elsewhere in your component, you can assign it to a property:
    this.categoryMap = categoryMap;
    }

    @wire(exportCategoryPicklist, {})
wiredCategoryPicklistMethod({ error, data }) {
    // If data is returned from the wire function
    if (data) {
        // Assign the mapped data to the correct property
        this.wiredCategoryPicklist = data.map(option => {
            return {
                label: option.label,
                value: option.value,
                Category_Pics: Category_Pics + '/MenuCategories/' + option.value + '.jpg'
            };
        });
    }
    // If there is an error
    else if (error) {
        // Log the error to the console
        console.error(error);   
    }
}

    handleClickedCategory(event){
        const categoryValue = event.currentTarget.dataset.id;
        this.selectedCategory = this.wiredCategoryPicklist.find(category => category.value === categoryValue);
        if (this.selectedCategory) {
            this.selectedCategory = this.selectedCategory.label;
            console.log('Selected Category: ' + this.selectedCategory);
            this.getDetails();
        }
    }


    get groupedCategoryPicklists() {
        const groupedPicklists = [];
        const itemsPerGroup = 5;

        for (let i = 0; i < this.wiredCategoryPicklist.length; i += itemsPerGroup) {
            groupedPicklists.push(this.wiredCategoryPicklist.slice(i, i + itemsPerGroup));
        }

        return groupedPicklists;
    }

    takeToMenu(event){
        const restaurantId = event.currentTarget.dataset.id;
        this.selectedRestaurant = this.menuAndRestaurantArray.find(restaurant => restaurant.Id === restaurantId);
        this.menuPage = true;
        this.homePage=false;
        this.getParticularDetails();
        console.log('this.unique: '+JSON.stringify(this.unique));
        console.log('selectedRestaurant: '+JSON.stringify(this.selectedRestaurant));
    }

    goBackToMainPage() {
        this.menuPage = false;
    }

    getParticularDetails() {
        returnParticularRestaurantAndMenu({ restaurantName: this.selectedRestaurant.Name, categoryChosen: '' })
            .then((result) => {    
                console.log('result:', result);
                this.listofMenu = [];
                for (var key in result) {
                    this.listofMenu.push({
                        key: key,
                        value: result[key].map(menuItem => ({ ...menuItem, count: 0, totalPerItem:0})),
                        showItems: false // Add a property to control visibility
                    });
                    console.log('key', key, result[key]);
                }
                console.log('listofMenu: ' + JSON.stringify(this.listofMenu));
            })
            .catch((error) => {
                console.error(error);
            });
    }
    


    
    handleCategoryClick(event) {
        const selectedCategory = event.currentTarget.textContent;
        this.listofMenu = this.listofMenu.map(category => {
            if (category.key === selectedCategory) {
                category.selected = !category.selected;
            } else {
                category.selected = false;
            }
            return category;
        });
    }

    handleAccordionClick(event) {
        const clickedCategory = event.currentTarget.dataset.key;
        this.listofMenu = this.listofMenu.map(category => ({
            ...category,
            showItems: category.key === clickedCategory ? !category.showItems : false
        }));
    }

    handleIncrement(event) {
        console.log('In increment handler class');
        const menuItemId = event.target.dataset.id;
        const menuItem = this.findMenuItemById(menuItemId);
    
        if (menuItem) {
            menuItem.count += 1;
            menuItem.totalPerItem+=menuItem.Price__c;
            console.log('Calling updateGrandTotal');
            this.updateGrandTotal();
            this.listofMenu = [...this.listofMenu]; 
        }
        console.log('printing values');
        console.log('count: '+menuItem.count);
        console.log('totalPerItem: '+menuItem.totalPerItem);
        console.log('menuList'+this.listofMenu.count);
    }
    
    
    handleDecrement(event) {
        const menuItemId = event.target.dataset.id;
    const menuItem = this.findMenuItemById(menuItemId);

    if (menuItem && menuItem.count > 0) {
        menuItem.count -= 1;
        menuItem.totalPerItem-=menuItem.Price__c;
        console.log('Calling updateGrandTotal');
        this.updateGrandTotal();
        this.listofMenu = [...this.listofMenu]; 
    }
    }
    
    findMenuItemById(menuItemId) {
        console.log('In findMenuItemById handler class');
        for (const category of this.listofMenu) {
            for (const menuItem of category.value) {
                if (menuItem.Id === menuItemId) {
                    return menuItem;
                }
            }
        }
        return null;
    }
    
    handleFromMenuBackToMain(){
        this.menuPage = false;
        this.homePage=true;
    }

    takeToCartPage(){
        this.itemsInCartList = [];
        this.listofMenu.forEach(category => {
            category.value.forEach(menuItem => {
                if (menuItem.count > 0) {
                    
                    this.itemsInCartList.push({
                        menuItemId: menuItem.Id,
                        restaurantName: this.selectedRestaurant.Id,
                        foodName: menuItem.Food_Name__c, 
                        count: menuItem.count,
                        totalPerItem: menuItem.totalPerItem,
                        grandTotal: menuItem.grandTotal
                });
                
            }
        });
    });
    console.log('Calling updateGrandTotal');
    this.updateGrandTotal();
    console.log('itemsInCartList: ' + JSON.stringify(this.itemsInCartList));
    if(this.itemsInCartList.length>0){
            this.cartPage=true;
            this.menuPage = false;
            this.homePage=false;
        }   
    }

    updateGrandTotal() {
        console.log('In updateGrandTotal');
        this.grandTotal = this.itemsInCartList.reduce((total, item) => total + item.totalPerItem, 0);
        console.log('this.grandTotal: '+this.grandTotal);
    }

    handleFromCartToHome(){
        this.cartPage=false;
        this.menuPage=true;
    }


    handleSendItemsListToBackend() {
        console.log('Clicked!!');
    
        // Separate arrays to store different values
        let menuItemIds = [];
        let restaurantNames = [];
        let counts = [];
        let grandtotal=[];
        // Iterate through itemsInCartList
        this.itemsInCartList.forEach(item => {
            // Extract and store values in separate arrays
            menuItemIds.push(item.menuItemId);
            restaurantNames.push(item.restaurantName);
            counts.push(item.count);
        });
        
        this.customerIdToPass=this.customerarray[0].Id;
        if(this.selectedAddress=='Home'||this.selectedAddress==''){
            this.stateName=this.customerarray[0].Home_Address__StateCode__s;
            this.streetName=this.customerarray[0].Home_Address__Street__s;
            this.zipCodeValue=this.customerarray[0].Home_Address__PostalCode__s;
            this.cityName=this.customerarray[0].Home_Address__City__s;
            this.countryName=this.customerarray[0].Home_Address__CountryCode__s;
        }else{
            this.stateName=this.customerarray[0].Work_Address__StateCode__s;
            this.streetName=this.customerarray[0].Work_Address__Street__s;
            this.zipCodeValue=this.customerarray[0].Work_Address__PostalCode__s;
            this.cityName=this.customerarray[0].Work_Address__City__s;
            this.countryName=this.customerarray[0].Work_Address__CountryCode__s;
        }
        // Now you have separate arrays for each value
        console.log('MenuItemIds: ' + JSON.stringify(menuItemIds));
        console.log('RestaurantNames: ' + JSON.stringify(restaurantNames));
        console.log('Counts: ' + JSON.stringify(counts));
        console.log('this.stateName: '+this.stateName);
        console.log('this.streetName: '+this.streetName);
        console.log('this.zipCodeValue: '+this.zipCodeValue);
        console.log('this.cityName: '+this.cityName);
        console.log('this.countryName: '+this.countryName);
        console.log('this.customerIdToPass: '+this.customerIdToPass);
        // Call the Apex method with the extracted values
        insertDataToCart({
            restaurantNames: restaurantNames,
            menuItemIds: menuItemIds,
            counts: counts, 
            street: this.streetName,
            city: this.cityName,
            country: this.countryName,
            zipCode: this.zipCodeValue,
            state: this.stateName,
            customerId: this.customerIdToPass
        }).then(result => {
            // Handle the result if needed
            this.cartId = result;
            console.log('Apex method result: ' + JSON.stringify(result));
            console.log('this.cartId: '+this.cartId); 
        }).catch(error => {
            // Handle errors if any
            console.error('Error calling Apex method: ' + JSON.stringify(error));
        }).finally(()=>{
            this.waitingPage=true;
            this.cartPage=false;
            console.log('Waiting 30 secs');
            this.startTimer();
        });
        
    }

    startTimer() {
        let totalTime = 30; // 5 minutes (300 seconds)
        let elapsed = 0;

        const intervalId = setInterval(() => {
            elapsed++;
            const remaining = totalTime - elapsed;
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            this.formattedTime = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

            const circle = this.template.querySelector('.progress-ring__circle');
            if (circle) {
                const circumference = 314; // Circumference of a circle with radius 50
                const dashOffset = circumference * (remaining / totalTime);
                circle.style.strokeDashoffset = dashOffset;
            }

            if (remaining <= 0) {
                clearInterval(intervalId);
            }
        }, 1000);
        
        setTimeout(() => {   
            console.log('Waited 30 secs');
            this.handleReceiveCardUpdate();
        }, 30000);
    }   


    handleReceiveCardUpdate(){
        console.log('approvalStatus entered');
        approvalStatus({insertedCartId:this.cartId})
            .then((result)=>{
                console.log('result:', result);
                this.cartStatus=result;
                console.log('this.cartStatus:', this.cartStatus);
                if(this.cartStatus=='Accept'){
                    this.acceptPage=true;
                    this.waitingPage=false;
                    console.log('handleDeliveryInsert called');
                    this.handleDeliveryInsert();
                }else if(this.cartStatus=='Decline'){
                    this.declinePage=true;
                    this.waitingPage=false;
                }
            })
            .catch((error)=>{
                console.error(error);
            });
    }

      

    handleDeliveryInsert(){
        console.log('handleDeliveryInsert entered');
        deliveryProcessApprovals({insertedCartId:this.cartId})
            .then((result)=>{
                console.log('result:', result);
                this.deliveryProcessId = result;
                console.log('this.deliveryProcessId: '+this.deliveryProcessId);
                console.log('startDeliveryTimer');
                this.startDeliveryTimer();
            })
            .catch((error)=>{
                console.error(error);
            });
    }

    startDeliveryTimer() {
        console.log('30 seconds begin');
        let totalTime = 30; // 5 minutes (300 seconds)
        let elapsed = 0;

        const intervalId = setInterval(() => {
            elapsed++;
            const remaining = totalTime - elapsed;
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            this.formattedTime = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

            const circle = this.template.querySelector('.progress-ring__circle');
            if (circle) {
                const circumference = 314; // Circumference of a circle with radius 50
                const dashOffset = circumference * (remaining / totalTime);
                circle.style.strokeDashoffset = dashOffset;
            }

            if (remaining <= 0) {
                clearInterval(intervalId);
            }
        }, 1000);
        
        setTimeout(() => {   
            console.log('Waited 30 secs');
            console.log('handleDeliveryUpdate called');
            this.handleDeliveryUpdate();
        }, 30000);
    }
    
    handleDeliveryUpdate(){
        console.log('handleDeliveryUpdate entered');
        exportDeliveryApprovalStatus({insertedDeliveryProcessId:this.deliveryProcessId})
            .then((result)=>{
                console.log('result:', result);
                this.deliveryStatus=result;
                console.log('this.deliveryStatus:', this.deliveryStatus);
                if(this.cartStatus=='Accept'){
                    this.deliveryPage=true;
                    this.acceptPage=false;
                    this.handleSubscribe();
                }
            })
            .catch((error)=>{
                console.error(error);
            });
    }


    proxyToObj(obj){
        return JSON.parse(JSON.stringify(obj));
    }
 

    handleSubscribe() {
        const self = this;
        return new Promise((resolve) => {
            const messageCallback = function (response) {
                console.log('New message received 1: ', JSON.stringify(response));
    
                var obj = JSON.parse(JSON.stringify(response));
    
                self.data = self.proxyToObj(self.data);
                self.data.push({Status_of_Delivery__c: obj.data.payload.Status_of_Delivery__c});
                console.log('this.data -> ' + JSON.stringify(self.data));
    
                // Additional log statement
                console.log('Promise will be resolved now.');
    
                resolve(); // Resolve the Promise after processing the Platform Event message
            };
    
            subscribe(this.channelName, -1, messageCallback).then(response => {
                console.log('Subscription request sent to: ', JSON.stringify(response.channel));
                this.subscription = response;
                console.log('this.subscription: ' + this.subscription);
    
                // Move the console.log inside this block
                console.log('Promise will be resolved now.');
            });
        });
    }
    
    
    // Example usage in another method
    takeToReviewPage() {
        console.log('In takeToReviewPage');
    
        // Wait for the handleSubscribe Promise to be resolved before proceeding
        this.handleSubscribe().then(() => {
            // Check if 'this.data' is not null and has entries
            if (this.data && this.data.length > 0) {
                // Check if at least one entry has 'Status_of_Delivery__c' === 'Completed'
                if (this.data.some(entry => entry.Status_of_Delivery__c === 'Completed')) {
                    // Take the necessary action, for example, setting 'reviewPage' to true
                    this.reviewPage = true;
                    this.deliveryPage=false;
                }
            }
        });
    }
    


    takeFromReviewPageToHome(){
        this.waitingPage=false;
        this.homePage=true;
        this.acceptPage=false;
        this.declinePage=false; 
        this.reviewPage=false;
    }

    ratingStar(event) {
        if (event.target.name === "Delivery") {
          this.deliveryrating = event.target.value;
          console.log('this.deliveryrating: '+this.deliveryrating);
        }
      }

      submitReview(){
        insertReviewsReceived({restaurantId:this.selectedRestaurant.Id,customerId:this.customerarray[0].Id,cartId:this.cartId, reviewReceived:this.deliveryrating})
            .then(result=>{
                console.log('success: '+result);
                this.reviewPage=false;
                this.homePage=true;
            }).catch(error => {
                console.error('Error: ', error);
            });
      }
    
      handleUsernameChange(event){
        this.username=event.target.value;
      }

      handlePasswordChange(event){
        this.password=event.target.value;
      }


    handleLoginBackend() {
        userCredentials({ UserName: this.username, PassWord: this.password })
            .then(result => {
                if (result.length>0) {
                    this.showToastMessage('Login Successful!', 'Success', 'success');
                    this.customerarray=result;
                    this.initializeMapMarkers();
                    console.log('this.customerarray: '+JSON.stringify(this.customerarray));
                    this.homePage=true;
                    this.loginPage=false;
                } else {
                    this.showToastMessage('Invalid username or password', 'Error', 'error');
                }
            })
            .catch(error => {
                console.error('Error during login:', error);
                this.showToastMessage('An error occurred during login', 'Error', 'error');
            });
    }

    showToastMessage(message,title,variant){
        const event = new ShowToastEvent({
            message:message,
            title:title,
            variant:variant
        });
        this.dispatchEvent(event);
    }

    get options() {
        return [
            { label: 'Home', value: 'Home' },
            { label: 'Work', value: 'Work' },
        ];
    }

    handleAddressSelected(event){
        this.selectedAddress = event.target.value;
        // Perform actions based on the selected value
        console.log('Selected value:', this.selectedAddress);
        if(this.selectedAddress=='Work'){
            this.showWorkAddress=true;
            this.showHomeAddress=false;
        }else{
            this.showHomeAddress=true;
            this.showWorkAddress=false;
        }
    }

    initializeMapMarkers() {
        if (this.customerarray && this.customerarray.length > 0) {
            this.mapMarkers = [
                {
                    location: {
                        City: this.customerarray[0].Home_Address__City__s,
                        Country: this.customerarray[0].Home_Address__CountryCode__s,
                        PostalCode: this.customerarray[0].Home_Address__PostalCode__s,
                        State: this.customerarray[0].Home_Address__StateCode__s,
                        Street: this.customerarray[0].Home_Address__Street__s,
                    },
                    value: 'SF1',
                    icon: 'standard:account',
                    title: 'Your Delivery Address',
                    description: 'Your order will be delivered here',
                },
                {
                    location: {
                        City: this.customerarray[0].Work_Address__City__s,
                        Country: this.customerarray[0].Work_Address__CountryCode__s,
                        PostalCode: this.customerarray[0].Work_Address__PostalCode__s,
                        State: this.customerarray[0].Work_Address__StateCode__s,
                        Street: this.customerarray[0].Work_Address__Street__s,
                    },
                    value: 'SF2',
                    icon: 'standard:account',
                    title: 'Restaurant Address',
                },
            ];
    
            this.selectedMarkerValue = 'SF1';
        }
    }

    handleMarkerSelect(event) {
        this.selectedMarkerValue = event.target.selectedMarkerValue;
    }


    handleRestaurantOrMenuSearch(event) {
        this.searchKey = event.target.value;
        this.searchRestaurants();
    }

    searchRestaurants() {
        searchParticularRestaurantMenuOrCategory({ searchTerm: this.searchKey })
        .then((result) => {
            this.menuAndRestaurantArray = result.map((iterator) => {
                let stars = this.renderStars(iterator.Rating__c);
                // Extract unique categories
                let uniqueCategories = [...new Set(iterator.Menu__r.map(menu => menu.Category__c))];
                //extract only 3
                //let uniqueCategories = iterator.Menu__r.map(menuItem => menuItem.Category__c).slice(0, 3);
                return {
                    ...iterator,
                    RestPicTemp: Restaurant_Pics + '/RestaurantPics/' + iterator.Restaurant_Pic_Name__c + '.jpg',
                    stars: stars,
                    UniqueCategories: uniqueCategories,
                };
            });
            console.log('this.menuAndRestaurantArray: ' + JSON.stringify(this.menuAndRestaurantArray));
        })
            .catch(error => {
                // Handle errors
                console.error(error);
            });
    }
}