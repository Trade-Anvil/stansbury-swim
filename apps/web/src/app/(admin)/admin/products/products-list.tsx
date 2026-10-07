'use client'

import { useState, useEffect } from 'react'
import { ProductResponseDto } from '@/api'
import DeleteProductModal from './delete-product-modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/table'
import { Button } from '@components/button'
import ProductEditModal from './product-edit-modal'
import { ProductService } from '@/services/api/shared/productService'

export default function ProductsList() {
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<ProductResponseDto | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductResponseDto | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await ProductService.findAll()
        setProducts(data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleEditClick = (product: ProductResponseDto, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingProduct(product)
  }

  const handleDeleteClick = (product: ProductResponseDto, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingProduct(product)
  }

  const handleCloseEditModal = () => {
    setEditingProduct(null)
  }

  const handleCloseDeleteModal = () => {
    setDeletingProduct(null)
  }

  const handleSuccess = () => {
    window.location.reload()
  }

  if (isLoading) {
    return <div className="mt-8 text-center">Loading products...</div>
  }

  return (
    <>
      <ul className="mt-10">
        <Table className="mt-8 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Credits</TableHeader>
              <TableHeader>Lesson type</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {products
              .sort((a, b) => a.order - b.order)
              .map(product => (
                <TableRow key={product.id} title={`Product #${product.id}`}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{product.amount}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{product.credits}</TableCell>
                  <TableCell>{product.lessonType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button onClick={e => handleEditClick(product, e)}>Edit</Button>
                      <Button onClick={e => handleDeleteClick(product, e)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </ul>

      {editingProduct && (
        <ProductEditModal
          key={editingProduct.id}
          isOpen={!!editingProduct}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
          product={editingProduct}
        />
      )}

      {deletingProduct && (
        <DeleteProductModal
          isOpen={!!deletingProduct}
          onClose={handleCloseDeleteModal}
          onSuccess={handleSuccess}
          product={deletingProduct}
        />
      )}
    </>
  )
}
