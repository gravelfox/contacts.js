//condensed as much as possible from components to keep it all on one file to (hopefully)
//improve readability...


import React, { Component } from "react";
import { FormGroup, FormControl, ControlLabel, Button, Checkbox, Modal } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { invokeApig } from "../libs/awsLib";
import ReactTable from "react-table";
import "react-table/react-table.css";
import "./contacts.css";


export default class contacts extends Component {

    constructor(props) {
        super(props);

        this.state = {
            fullContacts: [{}],
            searchContacts: null,
            prevSearchValue: null,
            searchValue: "",
            page: 1,
            isLoading: true,
            isAdding: false,
            isAddingMultiple: false,
            selected: [],
            selectAll: 0,
            multiDelete: false,
            tableLength: 10,
            tablePage: 1,
            showEditContactModal: false,
            showAddContactModal: false,
            useFilteredResults: false,
            editContactId: null,
            addContactFname: "",
            addContactLname: "",
            addContactEmail: "",
            editContactFname: "",
            editContactLname: "",
            editContactEmail: "",
            emailValid: false,
            addingMultiple: false,
            multiAddRows: 5,
            multiAddArray: [
                {key: 0, first:"", last:"", email:""},
                {key: 1, first:"", last:"", email:""},
                {key: 2, first:"", last:"", email:""},
                {key: 3, first:"", last:"", email:""},
                {key: 4, first:"", last:"", email:""}
            ],
            failureArray: []
        };
        this.toggleRow = this.toggleRow.bind(this);
    }

    componentWillMount() {
        //fetch the list of contacts from mailchimp
        try {
            invokeApig({
                path: `/mc/contacts`
            }).then((contacts) => {
                this.setState({
                    fullContacts: contacts.members,
                    isLoading: false
                });
            });
        } catch (e) {
            console.dir("dir: ", e);
            console.log("log: ", e);
            alert("An error occurred while retrieving your contacts. Please Contact Trusty Raven Support.");
        }
        
    }

    componentDidMount () {
        //this little ditty cleans up the up and down arrow functionality
        //in the react-table (in most browsers)...
        document.getElementsByClassName("-pageJump")[0].onclick = (e) => {this.handlePageChange(e)};
    }

    handleSearchChange = (event) => {
        //onChange handler for searchbox
        if(event.target.value === ""){
            this.setState({
                useFilteredResults: false
            });
        }
        this.setState({ searchValue: event.target.value },
            () => {this.searchContacts()});
    }

    searchContacts() {
        // creates an array of contacts that contain the search term in any of the FNAME, LNAME or email_address properties
        // and saves the array to state as searchContacts. First checks to see if the current search term contains the previous
        // term and if so whittles down the previous list instead of starting from scratch.
        this.setState({ isLoading: true });
        var contactList = (this.state.prevSearchValue && this.state.searchValue.includes(this.state.prevSearchValue)) 
            ? this.state.searchContacts 
            : this.state.fullContacts;
        var searchList = [];
        contactList.forEach(contact => {
            if(contact.merge_fields.FNAME.toLowerCase().includes(this.state.searchValue.toLowerCase())){
                searchList.push(contact);
            }else if(contact.merge_fields.LNAME.toLowerCase().includes(this.state.searchValue.toLowerCase())){
                searchList.push(contact);
            }else if(contact.email_address.toLowerCase().includes(this.state.searchValue.toLowerCase())){
                searchList.push(contact);
            }
        });

        this.setState({ 
            searchContacts: searchList,
            prevSearchValue: this.state.searchValue,
            isLoading: false,
            useFilteredResults: (this.state.tableLength >= searchList.length) ? true : false
        });
    }

    toggleRow(id) {
        //toggles the inclusion of a contact in the "selected" array for the multi-delete functionality
        const newSelected = this.state.selected;
        if(newSelected.includes(id)){
            newSelected.splice(newSelected.findIndex(value => value === id),1);
        }else{
            newSelected.push(id);
        }
        this.setState({
            selected: newSelected,
            selectAll: 2
        });
    }

    toggleSelectAll() {
        //handler for the select all checkbox, selects all if was unchecked, unselects all if ANYTHING was checked...
        var output = [];
        if(this.state.selectAll === 0){
            var checkboxes = document.getElementsByClassName("delete-checkbox");
            for (let i = 0; i < checkboxes.length; i++) {
                output.push(checkboxes[i].childNodes[0].childNodes[0].id);
            }
        }
        this.setState({ 
            selected: output,
            selectAll: this.state.selectAll === 0 ? 1 : 0
        });
    }

    handleToggleMultiDelete = (event) => {
        //adds the selection checkbox column when user clicks "delete multiple" button or removes the selection 
        //checkbox column when the user clicks the "cancel delete" button (which only appears once the delete 
        //multiple button has been clicked)
        this.setState({ 
            multiDelete: this.state.multiDelete ? false : true,
            selected: [],
            selectAll: 0
         });
    }

    handleClickContact = (id) => {
        //toggles the row selection if delete multiple is enabled, opens edit contact modal if it hasn't.
        if(this.state.multiDelete === true){
            this.toggleRow(id);
            return;
        }
        this.setState({
            showEditContactModal: true,
            editContactId: id,
            editContactFname: this.state.fullContacts.find(contact => contact.id === id).merge_fields.FNAME,
            editContactLname: this.state.fullContacts.find(contact => contact.id === id).merge_fields.LNAME,
            editContactEmail: this.state.fullContacts.find(contact => contact.id === id).email_address,
            emailValid: false
        }, () => {this.validateEmail(this.state.editContactEmail)});
    }

    handleModalInputChange = (event) => {
        //onChange handler for modal inputs, if it's an email address input, vaidates email address
        this.setState({ [event.target.name]: event.target.value });
        if(event.target.name === "addContactEmail" || event.target.name === "editContactEmail")
            this.validateEmail(event.target.value);
    }

    validateEmail = (email) => {
        //email address validator
        var re = /^(?:[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
        this.setState({ emailValid: re.test(email.toLowerCase()) });
    }

    handleAddContactModal = () => {
        //opens the add contact modal (for adding single contact)...
        this.setState({
            showAddContactModal: true,
            addContactFname: "",
            addContactLname: "",
            addContactEmail: "",
            emailValid: false
        });
    }

    handleAddContact = (e) => {
        //adds the contact the to the user's mailchimp contacts list
        e.preventDefault(); //prevent reload on submit
        this.setState({ isAdding: true });
        const userDetails = {
            FName: this.state.addContactFname,
            LName: this.state.addContactLname,
            email_address: this.state.addContactEmail
        }
        this.addContact(userDetails)
        .then((result) => {
            console.log(result);
            if(!result){
                //api call errored out
                this.setState({
                    isAdding: false
                });
                return;
            }
            const newContacts = [...this.state.fullContacts, result]; //add the added contact to the contacts list
            this.setState({
                isAdding: false, 
                showAddContactModal: false,
                fullContacts: newContacts
            }, () => {
                if(this.state.useFilteredResults) {
                    this.searchContacts(); //refreshes search results to include new contacts
                }
            });
        });
    }

    handleEditContact = (event) => {
        event.preventDefault();//prevent reload on submit
        this.setState({ isEditing: true });
        const userDetails = {
            id: this.state.editContactId,
            FName: this.state.editContactFname,
            LName: this.state.editContactLname,
            email: this.state.editContactEmail
        };
        this.editContact(userDetails)
            .then((result) => {
                if(!result){
                    //api call errored out
                    console.log("An error occured.");
                    this.setState({isEditing: false});
                    return;
                }
                //updates the contacts info on the displayed list (page does not retrieve fresh list)
                var newContacts = this.state.fullContacts;
                const newContactIndex = newContacts.findIndex(contact => contact.id === userDetails.id);
                newContacts[newContactIndex] = result;
                this.setState({
                    isEditing: false,
                    showEditContactModal: false,
                    fullContacts: newContacts
                }, () => {
                    if(this.state.useFilteredResults) {
                        this.searchContacts(); //refreshes search results to include new contacts
                    }
                })
            })
    }

    handleDeleteContact = () => {
        //handles the deletion of a single contact
        const confirmDiscard = window.confirm(
            "Are you certain you want to delete this contact? This cannot be undone..."
        );
        if(!confirmDiscard){ 
            this.setState({ isDeleting: false });
            return;
        }
        this.setState({ isDeleting : true});
        this.deleteContact(this.state.editContactId)
            .then((result) => {
                if(result.statusCode === 204){
                    //removes contact from contact list clientside
                    var newContacts = this.state.fullContacts;
                    const newContactIndex = newContacts.findIndex(contact => contact.id === this.state.editContactId);
                    newContacts.splice(newContactIndex, 1);
                    this.setState({
                        isDeleting: false,
                        showEditContactModal: false,
                        fullContacts: newContacts
                    }, () => {
                        if(this.state.useFilteredResults) {
                            this.searchContacts(); //updates search results
                        }
                    })
                } else {
                    //if it failed, turns off the delete button's spinner
                   this.setState({
                       isDeleting: false
                   });
                }
            })
    }

    handlePageChange = (event) => {
        //works with the line in the componentDidMount function to fix what I consider lame functionality of the react-table:
        //when the user clicks the up or down arrow next to the page number, it jumps immediately instead of requiring the user
        //to hit enter. I guess I shouldn't look a gift horse in the mouth but wtf was he/she thinking?
        const enterStroke = new KeyboardEvent("keypress", {
            view: window,
            keyCode: 13,
            bubbles: true,
            cancelable: true
          });
        event.target.dispatchEvent(enterStroke);
    }

    handleConfirmMultiDelete = () => {

        //handles the deletion of multiple contacts
        const confirmDiscard = window.confirm(
            `Are you certain you want to delete ${this.state.selected.length === 1 
                ? "this" 
                : "these " 
                + (this.state.selected.length)} contact${this.state.selected.length > 1 ? "s" : ""}? This cannot be undone...`
        );
        if(!confirmDiscard){ 
            this.setState({ isDeleting: false });
            return;
        }
        this.setState({ isMultiDeleting : true});
        this.deleteMultipleContacts();
        this.setState({
            isMultiDeleting: false,
            fullContacts: this.removeContacts(this.state.selected),
            selected: []
        }, () => {
            if(this.state.useFilteredResults) {
                this.searchContacts();//updates the search results after the deletion
            }
        })
    }

    removeContacts = (contacts) => {
        //takes an array of contacts and removes them from the contacts list
        var newContactList = this.state.fullContacts;
        contacts.forEach((contact) => {
            newContactList.splice(newContactList.findIndex(x => x.id === contact ), 1);
        })
        return newContactList;
    }

    handleKeyPress = (e) => {
        //if the search box has focus, and the user hits enter, expands the number of rows to include all results
        //not less than 10 rows.
        if(e.key === "Enter"){
            if(this.state.searchContacts){
                this.setState({
                    useFilteredResults: true,
                    tableLength: Math.max(this.state.searchContacts.length,10)
                })
            }
        }
    }

    handlePageSizeChange = (newSize) => {
        //handes the change in row count
        this.setState({tableLength: newSize});
    }

    async deleteMultipleContacts() {
        //calls api for deleting multiple contacts
        const payload = {contacts: this.state.selected}
        try {
            const result = await invokeApig({
                path: "/mc/contacts",
                method: "delete",
                body: payload
            });
            return result;
        } catch (e) {
            console.dir(e);
            alert("An error occured while deleting multiple contacts. Please contact Trusty Raven Support.");
        }
    }

    async addContact(user) {
        //calls api for adding single user
        try {
            const result = await invokeApig({
                path: "/mc/contacts",
                method: "post",
                body: user
            });
            return result;
        } catch (e) {
            console.log(e);
            alert("An error occured while adding the contact. Please contact Trusty Raven Support.");
        }
    }

    async editContact(user) {
        //calls api to edit a contact
        try {
            const result = await invokeApig({
                path: `/mc/contacts/${user.id}`,
                method: "post",
                body: user
            });
            return result;
        } catch (e) {
            console.log(e);
            alert("An error occured while editing the contact. Please contact Trusty Raven Support.");
        }
    }

    async deleteContact(id){
        //calls api to delete a single contact
        try {
        const result = await invokeApig({
            path: `/mc/contacts/${id}`,
            method: "delete"
        });
        return result;
        } catch (e) {
            alert("Something went wrong while deleting this contact, please contact Trusty Raven support.")
            return e;
        }
    }

    handleMultipleClick = () => {
        //opens the modal to add multiple users at once
        var array = this.state.multiAddArray;
        const object = {key:0, first:this.state.addContactFname, last: this.state.addContactLname, email: this.state.addContactEmail}
        array[0] = object;
        this.setState({ 
            addingMultiple: true,
            multiAddArray: array
         });
    }

    generateInputFields = () => {
        //generates JSX for the input fields for for the add multiple users modal
        return this.state.multiAddArray.map(contact => {
                return (
                        <tr key={contact.key}>
                            <td>
                                <FormGroup validationState={this.state.failureArray.includes(contact.key) ? "error" : null } key={contact.key}>
                                    <FormControl 
                                        name={"first" + contact.key}
                                        type="text"
                                        placeholder="First Name"
                                        onChange={this.handleMultipleInputChange}
                                        value={this.state.multiAddArray[contact.key].first}
                                        className="first-name-field"
                                    />
                                </FormGroup>
                            </td>
                            <td>
                                <FormGroup validationState={this.state.failureArray.includes(contact.key) ? "error" : null } key={contact.key}>
                                    <FormControl 
                                        name={"last" + contact.key}
                                        type="text"
                                        placeholder="Last Name"
                                        onChange={this.handleMultipleInputChange}
                                        value={this.state.multiAddArray[contact.key].last}
                                        className="last-name-field"
                                    />
                                </FormGroup>
                            </td>
                            <td>
                                <FormGroup validationState={this.state.failureArray.includes(contact.key) ? "error" : null } key={contact.key}>
                                    <FormControl 
                                        name={"email" + contact.key}
                                        type="text"
                                        placeholder="Email"
                                        onChange={this.handleMultipleInputChange}
                                        value={this.state.multiAddArray[contact.key].email}
                                        className="email-field"
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                )
            });
    }

    handleMultipleInputChange = (event) => {
        //handles onChange for the inputs in the add multiple users modal...
        const index = event.target.name.match(/\d+/)[0];//snags the index number from the input's name
        const prop = event.target.name.split(index)[0];//snags the property typle from the input's name
        var array = this.state.multiAddArray;
        array[index][prop] = event.target.value;//finds the correct property of the correct object corresponding to event's field
        //if the user is on the last row, make a new one below it, upper limit of 20 total rows...
        if(parseInt(index,10) === this.state.multiAddRows - 1 && this.state.multiAddRows < 20){
            array[this.state.multiAddRows] = {key: this.state.multiAddRows, first: "", last: "", email: ""};
            this.setState({ multiAddRows: this.state.multiAddRows + 1 })
        }
        this.setState({ multiAddArray: array });
        if( this.state.failureArray.length > 0 ) {
            this.validateContactArray();
        }   
    } 

    handleAddMultipleContacts = async () => {
        this.setState({ isAddingMultiple: true });
        this.validateContactArray();
        // *
        // *
        // *
        // *
        // *
        // *
        // ** look into this, could test failureArray.length before setState in validateContactArray() finishes??
        // *
        // *
        // *
        // *
        // *
        // *
        if( this.state.failureArray.length === 0 ){
            //if all contacts valid package array for api
            var data = this.state.multiAddArray;
            for (let index = 0; index < data.length; index++) {
                //remove the empty lines...
                if(data[index].first === ""){
                    data.splice(index,1);
                    index--;
                }                
            }
            try{
            invokeApig({
                path: "/mc/multipleContacts",
                method: "post",
                body: {contacts: data}
            })
                .then(() => {
                    this.addNewUsers(data);
                    this.setState({
                        isAddingMultiple: false
                    });
                    this.handleCancelMultiAdd();
                })
            } catch (e) {
                console.log(e);
                alert("An error occured while uploading your contacts. Please contact support.")
            }
        }
    }

    addNewUsers = (input) => {

        //adds an array of users to the contacts table so as to skip retrieving new list from mc server
        var output = [];
        for (let index = 0; index < input.length; index++) {
            output.push({
                email_address: input[index].email,
                merge_fields: {
                    FNAME: input[index].first,
                    LNAME: input[index].last
                }
            });
        }
        var newFullContacts = this.state.fullContacts.concat(output);
        this.setState({ fullContacts: newFullContacts });
    }

    validateContactArray = () => {
        //validate entries on add multiple contacts modal. Each entry must have first name, last name, and valid email address...
        //blank rows are okay...
        var failureArray = [];
        var re = /^(?:[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
        const array = this.state.multiAddArray;
        for (let i = 0; i < this.state.multiAddArray.length; i++) {
            if(array[i].first === "" && array[i].last === "" && array[i].email === "") continue; //row is blank, move on...
            if(array[i].first !== "" && array[i].last !== "" && re.test(array[i].email.toLowerCase().trim())) continue; //row has a first, last and a valid email, move on...
            failureArray.push(i);
        }
        this.setState({ failureArray }); //push the indecies of the invalid rows to the failureArray
    }

    handleCancelMultiAdd = () => {
        this.setState({
            showAddContactModal: false, 
            addingMultiple: false,
            multiAddRows: 5,
            multiAddArray: [
                {key: 0, first:"", last:"", email:""},
                {key: 1, first:"", last:"", email:""},
                {key: 2, first:"", last:"", email:""},
                {key: 3, first:"", last:"", email:""},
                {key: 4, first:"", last:"", email:""}
            ],
            failureArray: []
        });

    }


    render() {
        //if the search box has data, display the filtered results, else display full contacts list
        const data = this.state.useFilteredResults ? this.state.searchContacts : this.state.fullContacts;
        var columns = [];
        if (this.state.multiDelete){
            //if delete multiple is active, add a checkbox column to the left...
            columns = 
                [{
                    id: "checkbox",
                    accessor: "value",
                    Cell: ( row ) => {
                        return (
                            <div className="checkbox-cell">
                            <Checkbox
                                type="checkbox"
                                className="checkbox, delete-checkbox"
                                checked={this.state.selected.includes(row.original.id)}
                                id={row.original.id}
                            />
                            </div>
                        );
                    },
                    Header: title => {
                        return (
                            <div className="checkbox-cell">
                            <Checkbox
                                type="checkbox"
                                className="checkbox"
                                checked={this.state.selectAll === 1}
                                ref={input => {
                                    if (input) {
                                        input.indeterminate = this.state.selectAll === 2;
                                    }
                                }}
                                onChange={() => this.toggleSelectAll()}
                            />
                            </div>
                        );
                    },
                    sortable: false,
                    width: 45,
                    headerClassName: "col-header"
                }]
            };

            //build the rest of the columns
        columns.push(
            {
                Header: "First Name",
                accessor: "merge_fields.FNAME",
                headerClassName: "col-header"
            });
        columns.push(
            {
                Header: "Last Name",
                accessor: "merge_fields.LNAME",
                headerClassName: "col-header"
            });
        columns.push(
            {
                Header: "Email",
                accessor: "email_address",
                headerClassName: "col-header"
            });

        return(
            <div>
                <div className="search-container">
                    <FormGroup>
                        <FormControl
                            type="text"
                            placeholder="Search..."
                            onChange={this.handleSearchChange}
                            onKeyPress={this.handleKeyPress} //listens for enter, adjusts table row count to search results length on enter
                            value={this.state.searchValue}
                        />
                    </FormGroup>
                </div>
                <ReactTable
                    getTrProps={(state, rowInfo) => {
                        return {
                            onClick: (event) => {this.handleClickContact(rowInfo.original.id)}
                        }
                    }}
                    data={data}
                    loading={this.state.isLoading}
                    columns={columns}
                    pageSize={this.state.tableLength}
                    onPageSizeChange={this.handlePageSizeChange}
                    className="-striped -highlight"
                    noDataText="No Contacts"
                />
                <div className="add-button-container">
                    <Button
                        className="add-button"
                        bsStyle="primary"
                        onClick={this.handleAddContactModal}
                    >
                        + Add Contact
                    </Button>
                    <div className="delete-button-container">
                        <LoaderButton
                            className={this.state.multiDelete ? "confirm-delete-button" : "multi-delete-button"}
                            bsStyle="danger"
                            onClick={this.state.multiDelete ? this.handleConfirmMultiDelete : this.handleToggleMultiDelete}
                            disabled={this.state.multiDelete && this.state.selected.length === 0}
                            isLoading={this.state.isMultiDeleting}
                            loadingText="Deleting Contacts..."
                            text={this.state.multiDelete ? "Confirm Delete" : "Delete Multiple"}
                        />
                        {this.state.multiDelete &&
                            <Button
                                className="multi-delete-button cancel-button"
                                onClick={this.handleToggleMultiDelete}
                            >
                                Cancel Delete
                            </Button>
                        }
                    </div>
                </div>

                {/* Edit Contact Modal */}
                <div className="static-modal">
                    <Modal show={this.state.showEditContactModal}>
                        <form onSubmit={this.handleEditContact}>
                            <Modal.Header>
                                <Modal.Title>Edit Contact Info</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <FormGroup>
                                    <ControlLabel>First Name</ControlLabel>
                                    <FormControl
                                        name="editContactFname"
                                        type="text"
                                        placeholder="First Name"
                                        onChange={this.handleModalInputChange}
                                        value={this.state.editContactFname}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>Last Name</ControlLabel>
                                    <FormControl
                                        name="editContactLname"
                                        type="text"
                                        placeholder="Last Name"
                                        onChange={this.handleModalInputChange}
                                        value={this.state.editContactLname}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>Email Address</ControlLabel>
                                    <FormControl
                                        name="editContactEmail"
                                        type="text"
                                        placeholder="Email Address"
                                        onChange={this.handleModalInputChange}
                                        value={this.state.editContactEmail}
                                    />
                                </FormGroup>
                            </Modal.Body>
                            <Modal.Footer>
                                <LoaderButton
                                    className="delete-button"
                                    bsStyle="danger"
                                    onClick={this.handleDeleteContact}
                                    isLoading={this.state.isDeleting}
                                    text="Delete Contact"
                                    loadingText="Deleting Contact..."
                                />
                                <LoaderButton
                                    bsStyle="primary"
                                    type="submit"
                                    isLoading={this.state.isEditing}
                                    text="Update Contact"
                                    loadingText="Updating..."
                                    disabled={!this.state.editContactFname || !this.state.editContactLname || !this.state.emailValid}
                                />
                                <Button className="create-btn cancel-btn" onClick={() => {this.setState({showEditContactModal: false })}}>Cancel</Button>
                            </Modal.Footer>
                        </form>
                    </Modal>
                </div>


                {/* Add Contact Modal */}
                <div className="static-modal">
                    <Modal show={this.state.showAddContactModal && !this.state.addingMultiple}>
                        <form onSubmit={this.handleAddContact}>
                            <Modal.Header>
                                <Modal.Title>Add Contact</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <FormGroup>
                                    <ControlLabel>First Name</ControlLabel>
                                    <FormControl
                                        name="addContactFname"
                                        type="text"
                                        placeholder="First Name"
                                        onChange={this.handleModalInputChange}
                                        value={this.state.addContactFname}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>Last Name</ControlLabel>
                                    <FormControl
                                        name="addContactLname"
                                        type="text"
                                        placeholder="Last Name"
                                        onChange={this.handleModalInputChange}
                                        value={this.state.addContactLname}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>Email Address</ControlLabel>
                                    <FormControl
                                        name="addContactEmail"
                                        type="text"
                                        placeholder="Email Address"
                                        onChange={this.handleModalInputChange}
                                        value={this.state.addContactEmail}
                                    />
                                </FormGroup>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button
                                    className="left-btn"
                                    bsStyle="primary"
                                    onClick={this.handleMultipleClick}
                                >Add Multiple</Button>
                                <LoaderButton
                                    type="submit"
                                    bsStyle="primary"
                                    isLoading={this.state.isAdding}
                                    text="Add Contact"
                                    loadingText="Creating Contact..."
                                    disabled={!this.state.addContactFname || !this.state.addContactLname || !this.state.emailValid}
                                />
                                <Button className="create-btn cancel-button" onClick={() => {this.setState({showAddContactModal: false })}}>Cancel</Button>
                            </Modal.Footer>
                        </form>
                    </Modal>
                </div>

                {/* Add Multiple Contact Modal */}
                <div className="static-modal">
                    <Modal show={this.state.showAddContactModal && this.state.addingMultiple}>
                        <Modal.Header>
                            <Modal.Title>Add Multiple Contacts</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <table>
                                <thead>
                                    <tr>
                                        <th width="30%">First Name</th>
                                        <th width="30%">Last Name</th>
                                        <th width="40%">Email Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.generateInputFields()}
                                </tbody>
                                
                            </table>
                            {this.state.multiAddRows===20 &&
                            <span>Please add 20 contacts at a time...</span>}
                            {this.state.failureArray.length>0 &&
                            <span className="text-danger">Each contact must have first and last names and a valid email address.</span>}
                        </Modal.Body>
                        <Modal.Footer>
                            <LoaderButton
                                bsStyle="primary"
                                isLoading={this.state.isAddingMultiple}
                                text="Add Contacts"
                                loadingText="Adding Contacts..."
                                onClick={this.handleAddMultipleContacts}
                            />
                            <Button className="create-btn cancel-button" onClick={this.handleCancelMultiAdd}>Cancel</Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </div>
        );
    }
}

