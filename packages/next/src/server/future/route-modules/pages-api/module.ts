import type { IncomingMessage, ServerResponse } from 'http'
import type { PagesAPIRouteDefinition } from '../../route-definitions/pages-api-route-definition'
import type { PageConfig } from '../../../../../types'
import type { ParsedUrlQuery } from 'querystring'

import {
  RouteModule,
  RouteModuleOptions,
  type RouteModuleHandleContext,
} from '../route-module'
import { apiResolver } from '../../../api-utils/node/api-resolver'
import { __ApiPreviewProps } from '../../../api-utils'

type PagesAPIHandleFn = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void>

/**
 * The PagesAPIModule is the type of the module exported by the bundled Pages
 * API module.
 */
export type PagesAPIModule =
  typeof import('../../../../build/templates/pages-api')

type PagesAPIUserlandModule = {
  /**
   * The exported handler method.
   */
  readonly default: PagesAPIHandleFn

  /**
   * The exported page config.
   */
  readonly config?: PageConfig
}

type PagesAPIRouteHandlerContext = RouteModuleHandleContext & {
  /**
   * The incoming server request in non-edge runtime.
   */
  req?: IncomingMessage

  /**
   * The outgoing server response in non-edge runtime.
   */
  res?: ServerResponse

  /**
   * The revalidate method used by the `revalidate` API.
   *
   * @param config the configuration for the revalidation
   */
  revalidate: (config: {
    urlPath: string
    revalidateHeaders: { [key: string]: string | string[] }
    opts: { unstable_onlyGenerated?: boolean }
  }) => Promise<void>

  /**
   * The hostname for the request.
   */
  hostname?: string

  /**
   * Keys allowed in the revalidate call.
   */
  allowedRevalidateHeaderKeys?: string[]

  /**
   * Whether to trust the host header.
   */
  trustHostHeader?: boolean

  /**
   * The query for the request.
   */
  query: ParsedUrlQuery

  /**
   * The preview props used by the `preview` API.
   */
  previewProps: __ApiPreviewProps

  /**
   * True if the server is in development mode.
   */
  dev: boolean

  /**
   * True if the server is in minimal mode.
   */
  minimalMode: boolean

  /**
   * The page that's being rendered.
   */
  page: string
}

export type PagesAPIRouteModuleOptions = RouteModuleOptions<
  PagesAPIRouteDefinition,
  PagesAPIUserlandModule
>

export class PagesAPIRouteModule extends RouteModule<
  PagesAPIRouteDefinition,
  PagesAPIUserlandModule
> {
  constructor(options: PagesAPIRouteModuleOptions) {
    super(options)

    if (typeof options.userland.default !== 'function') {
      throw new Error(
        `Page ${options.definition.page} does not export a default function.`
      )
    }
  }

  /**
   *
   * @param req the incoming server request
   * @param res the outgoing server response
   * @param context the context for the render
   */
  public async render(
    req: IncomingMessage,
    res: ServerResponse,
    context: PagesAPIRouteHandlerContext
  ): Promise<void> {
    await apiResolver(
      req,
      res,
      context.query,
      this.userland,
      {
        ...context.previewProps,
        revalidate: context.revalidate,
        trustHostHeader: context.trustHostHeader,
        allowedRevalidateHeaderKeys: context.allowedRevalidateHeaderKeys,
        hostname: context.hostname,
      },
      context.minimalMode,
      context.dev,
      context.page
    )
  }
}

export default PagesAPIRouteModule
