import { supabase } from './config.js';

const form = document.getElementById('upload-form');
const btn = document.getElementById('upload-btn');
const stockList = document.getElementById('stock-list');

// 1. Load Stock on Page Load
async function loadStock() {
    stockList.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
    
    // Get products sorted by newest first
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        stockList.innerHTML = `<div class="alert alert-danger">Error loading stock</div>`;
        return;
    }

    stockList.innerHTML = ''; // Clear spinner

    if (data.length === 0) {
        stockList.innerHTML = `<div class="text-center text-muted">No items in stock.</div>`;
        return;
    }

    data.forEach(item => {
        const stockItem = `
        <div class="card mobile-card border-0">
            <div class="card-body p-2 d-flex align-items-center">
                <img src="${item.image_url}" class="stock-img me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-0 fw-bold">${item.name}</h6>
                    <small class="text-muted">Sizes: ${item.size}</small><br>
                    <small class="fw-bold">₦${item.price.toLocaleString()}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2 delete-btn" data-id="${item.id}" data-img="${item.image_url}">
                    Delete
                </button>
            </div>
        </div>`;
        stockList.innerHTML += stockItem;
    });

    // Attach delete events
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

// 2. Handle Delete
async function handleDelete(e) {
    if(!confirm("Are you sure you want to remove this item?")) return;

    const id = e.target.dataset.id;
    const btn = e.target;
    btn.innerText = "Deleting...";
    btn.disabled = true;

    // Delete from Database
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
        alert("Error deleting: " + error.message);
        btn.innerText = "Delete";
        btn.disabled = false;
    } else {
        // Refresh list
        loadStock(); 
    }
}

// 3. Handle Upload
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Gather all checked sizes
    const checkedBoxes = document.querySelectorAll('.size-check-input:checked');
    if (checkedBoxes.length === 0) {
        alert("Please select at least one size!");
        return;
    }
    // Join them into a string like "S, M, L"
    const sizeString = Array.from(checkedBoxes).map(cb => cb.value).join(', ');

    btn.disabled = true;
    btn.innerText = "Uploading...";

    const file = document.getElementById('p-file').files[0];
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;

    try {
        // Upload Image
        const fileName = `denims/${Date.now()}_${file.name.replace(/\s/g, '')}`;
        const { error: uploadError } = await supabase.storage.from('denims').upload(fileName, file);
        if (uploadError) throw uploadError;

        // Get URL
        const { data: { publicUrl } } = supabase.storage.from('denims').getPublicUrl(fileName);

        // Save to DB (Using the combined sizeString)
        const { error: dbError } = await supabase
            .from('products')
            .insert([{ name, price, size: sizeString, image_url: publicUrl }]); // Note: size is now the string
        
        if (dbError) throw dbError;

        alert('Success! Item added.');
        form.reset();
        // Clear checkboxes manually
        document.querySelectorAll('.size-check-input').forEach(cb => cb.checked = false);
        loadStock(); // Refresh the list below

    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "UPLOAD ITEM";
    }
});

// Initial load
loadStock();